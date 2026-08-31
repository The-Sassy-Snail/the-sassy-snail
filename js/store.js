import { defaultTemplate } from './data.js';
import { sectionsForDate, fromDateKey } from './util.js';
import * as fb from './firebase.js';

export const bus = new EventTarget();

let uid = null;
let template = null;
const dayCache = new Map(); // dateKey -> {checked}

function emit(name, detail) {
  bus.dispatchEvent(new CustomEvent(name, { detail }));
}

export function templateCacheKey(u) {
  return `sb-template-cache-${u}`;
}

// Converts sections saved under the old scheme (a fixed 'always' /
// 'notRunday' / 'runday' / 'tomorrowRunday' / 'sunday' condition) into the
// current weekday-picker scheme ({ days: [0-6], basis: 'today'|'tomorrow' }).
// Returns [migratedTemplate, didChange].
function migrateTemplate(tpl) {
  const ALL = [0, 1, 2, 3, 4, 5, 6];
  const RUN = [0, 2, 4];
  const NOT_RUN = [1, 3, 5, 6];
  let changed = false;
  const sections = tpl.sections.map((s) => {
    if (s.days) return s;
    changed = true;
    const { condition, ...rest } = s;
    let days = ALL;
    let basis = 'today';
    if (condition === 'runday') days = RUN;
    else if (condition === 'notRunday') days = NOT_RUN;
    else if (condition === 'sunday') days = [0];
    else if (condition === 'tomorrowRunday') {
      days = RUN;
      basis = 'tomorrow';
    }
    return { ...rest, days, basis };
  });
  return [{ ...tpl, sections }, changed];
}

export async function initForUser(userId) {
  uid = userId;
  dayCache.clear();

  const cachedRaw = localStorage.getItem(templateCacheKey(uid));
  if (cachedRaw) {
    try {
      const [migrated] = migrateTemplate(JSON.parse(cachedRaw));
      template = migrated;
      emit('template', template);
    } catch {
      /* ignore corrupt cache */
    }
  }

  let remote = null;
  try {
    remote = await fb.fetchTemplate(uid);
  } catch (e) {
    console.warn('Could not reach Firestore for template, using cache/default', e);
  }

  let needsRewrite = false;
  if (remote) {
    const [migrated, changed] = migrateTemplate(remote);
    template = migrated;
    needsRewrite = changed;
  } else if (!template) {
    template = defaultTemplate();
    needsRewrite = true;
  }

  localStorage.setItem(templateCacheKey(uid), JSON.stringify(template));
  emit('template', template);

  if (needsRewrite) {
    try {
      await fb.writeTemplate(uid, template);
    } catch (e) {
      console.warn('Could not save migrated/seeded template remotely (offline?)', e);
    }
  }

  return template;
}

export function getTemplate() {
  return template;
}

export async function saveTemplate(newTemplate) {
  template = newTemplate;
  localStorage.setItem(templateCacheKey(uid), JSON.stringify(template));
  emit('template', template);
  await fb.writeTemplate(uid, template);
}

export function sectionsForKey(dateKey) {
  return sectionsForDate(template, fromDateKey(dateKey));
}

export async function loadDay(dateKey) {
  if (dayCache.has(dateKey)) return dayCache.get(dateKey);
  const data = await fb.fetchDayLog(uid, dateKey);
  dayCache.set(dateKey, data);
  return data;
}

export function watchDay(dateKey, cb) {
  return fb.watchDayLog(uid, dateKey, (data) => {
    dayCache.set(dateKey, data);
    cb(data);
  });
}

export async function setChecked(dateKey, itemId, value) {
  const current = dayCache.get(dateKey) || { checked: {} };
  const nextChecked = { ...current.checked, [itemId]: value };
  const next = { ...current, checked: nextChecked };
  dayCache.set(dateKey, next);
  emit(`day:${dateKey}`, next);
  await fb.writeDayLog(uid, dateKey, nextChecked);
}

function dayProgress(dateKey, checked) {
  const sections = sectionsForKey(dateKey);
  let total = 0;
  let done = 0;
  for (const s of sections) {
    for (const it of s.items) {
      total += 1;
      if (checked && checked[it.id]) done += 1;
    }
  }
  return { total, done, pct: total ? done / total : 0 };
}

export { dayProgress };

function pad2(n) {
  return String(n).padStart(2, '0');
}

function keyOf(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export async function getRangeSummary(start, end) {
  const startKey = keyOf(start);
  const endKey = keyOf(end);

  let logs = {};
  try {
    logs = await fb.fetchLogsInRange(uid, startKey, endKey);
    for (const [k, v] of Object.entries(logs)) dayCache.set(k, v);
  } catch (e) {
    console.warn('Could not fetch range (offline?)', e);
    for (const [k, v] of dayCache.entries()) {
      if (k >= startKey && k <= endKey) logs[k] = v;
    }
  }

  const summary = {};
  const d = new Date(start);
  while (d <= end) {
    const key = keyOf(d);
    summary[key] = dayProgress(key, logs[key] && logs[key].checked);
    d.setDate(d.getDate() + 1);
  }
  return summary;
}

export async function getMonthSummary(year, month) {
  // month: 0-indexed
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return getRangeSummary(start, end);
}

export async function getRecentSummary(days) {
  const end = new Date();
  const start = addDaysLocal(end, -days);
  return getRangeSummary(start, end);
}

function addDaysLocal(d, n) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function currentUid() {
  return uid;
}
