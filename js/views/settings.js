import * as store from '../store.js';
import * as fb from '../firebase.js';
import { slugify } from '../data.js';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function uniqueId(existingIds, base) {
  let id = slugify(base) || 'item';
  let n = 2;
  while (existingIds.has(id)) {
    id = `${slugify(base)}-${n}`;
    n += 1;
  }
  existingIds.add(id);
  return id;
}

export function renderSettings(container, { onSignOut, onReconfigure, userEmail, getSWRegistration }) {
  let template = JSON.parse(JSON.stringify(store.getTemplate()));
  let notify = {
    enabled: false,
    morningTime: '07:00',
    eveningTime: '20:00',
    waterEnabled: false,
    waterStartHour: 6,
    waterEndHour: 21,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    tokens: [],
  };
  let notifyStatus = '';

  fb.fetchNotifySettings(store.currentUid())
    .then((remote) => {
      if (remote) notify = { ...notify, ...remote };
      // First time on a new device: if this browser has no VAPID key yet but
      // one was already saved from another device, pick it up automatically.
      if (remote?.vapidKey && !fb.getStoredVapidKey()) {
        fb.setStoredVapidKey(remote.vapidKey);
      }
      draw();
    })
    .catch((e) => console.warn('Could not load notification settings', e));

  async function persistNotify() {
    await fb.writeNotifySettings(store.currentUid(), {
      enabled: notify.enabled,
      morningTime: notify.morningTime,
      eveningTime: notify.eveningTime,
      waterEnabled: notify.waterEnabled,
      waterStartHour: notify.waterStartHour,
      waterEndHour: notify.waterEndHour,
      timezone: notify.timezone,
      vapidKey: fb.getStoredVapidKey() || null,
    });
  }

  function allIds() {
    const s = new Set();
    for (const sec of template.sections) {
      s.add(sec.id);
      for (const it of sec.items) s.add(it.id);
    }
    return s;
  }

  async function persist() {
    await store.saveTemplate(template);
  }

  function draw() {
    container.innerHTML = `
      <div class="settings-account card">
        <p><strong>Signed in as</strong><br>${userEmail || ''}</p>
        <div class="settings-actions">
          <button class="btn" id="btn-reconfigure">Change Firebase project</button>
          <button class="btn danger" id="btn-signout">Sign out</button>
        </div>
      </div>

      <div class="settings-notify card">
        <p><strong>🔔 Notifications</strong></p>
        <label class="notify-row">
          <span>Remind me on my phone</span>
          <input type="checkbox" id="notify-enabled" ${notify.enabled ? 'checked' : ''} />
        </label>
        <div class="notify-times">
          <label>Morning <input type="time" id="notify-morning" value="${notify.morningTime}" /></label>
          <label>Evening <input type="time" id="notify-evening" value="${notify.eveningTime}" /></label>
        </div>

        <label class="notify-row">
          <span>💧 Hourly water reminders</span>
          <input type="checkbox" id="notify-water-enabled" ${notify.waterEnabled ? 'checked' : ''} />
        </label>
        <div class="notify-times">
          <label>From <input type="time" id="notify-water-start" value="${String(notify.waterStartHour).padStart(2, '0')}:00" /></label>
          <label>To <input type="time" id="notify-water-end" value="${String(notify.waterEndHour).padStart(2, '0')}:00" /></label>
        </div>
        <p class="hint">Reminds you once every hour, on the hour, in that window.</p>

        <p class="hint">One-time per device: paste your Web Push key from Firebase (see SETUP.md), then turn notifications on below.</p>
        <input id="notify-vapid" placeholder="Web Push (VAPID) key" value="${escapeAttr(fb.getStoredVapidKey())}" />
        <button class="btn primary small" id="notify-enable-device" style="margin-top:0.6rem;">Turn on for this device</button>
        <p class="hint" id="notify-status">${notifyStatus}</p>
      </div>

      <h2>Edit your routine</h2>
      <p class="hint">Changes sync to every device you're signed into. Section visibility controls when a section shows up.</p>
      <div id="sections-editor"></div>
      <button class="btn" id="add-section">+ Add section</button>
    `;

    container.querySelector('#btn-signout').onclick = onSignOut;
    container.querySelector('#btn-reconfigure').onclick = onReconfigure;

    container.querySelector('#notify-enabled').addEventListener('change', (e) => {
      notify.enabled = e.target.checked;
      persistNotify();
    });
    container.querySelector('#notify-morning').addEventListener('change', (e) => {
      notify.morningTime = e.target.value;
      persistNotify();
    });
    container.querySelector('#notify-evening').addEventListener('change', (e) => {
      notify.eveningTime = e.target.value;
      persistNotify();
    });
    container.querySelector('#notify-water-enabled').addEventListener('change', (e) => {
      notify.waterEnabled = e.target.checked;
      persistNotify();
    });
    container.querySelector('#notify-water-start').addEventListener('change', (e) => {
      notify.waterStartHour = Number(e.target.value.split(':')[0]);
      persistNotify();
    });
    container.querySelector('#notify-water-end').addEventListener('change', (e) => {
      notify.waterEndHour = Number(e.target.value.split(':')[0]);
      persistNotify();
    });
    container.querySelector('#notify-vapid').addEventListener('change', (e) => {
      fb.setStoredVapidKey(e.target.value.trim());
      persistNotify();
    });
    container.querySelector('#notify-enable-device').addEventListener('click', async () => {
      const statusEl = container.querySelector('#notify-status');
      const vapidKey = fb.getStoredVapidKey();
      if (!vapidKey) {
        statusEl.textContent = 'Paste your Web Push key above first.';
        return;
      }
      statusEl.textContent = 'Requesting permission…';
      try {
        const swReg = await getSWRegistration();
        if (!swReg) throw new Error('Service worker not ready yet — try again in a moment.');
        const token = await fb.requestNotificationToken(vapidKey, swReg);
        if (!token) {
          statusEl.textContent = "No permission granted (or this browser doesn't support push). On iPhone, make sure the app is added to your Home Screen and opened from there.";
          return;
        }
        await fb.addDeviceToken(store.currentUid(), token);
        notify.enabled = true;
        await persistNotify();
        statusEl.textContent = '✅ Notifications are on for this device.';
        draw();
      } catch (e) {
        statusEl.textContent = `Couldn't enable notifications: ${e.message}`;
      }
    });

    const editor = container.querySelector('#sections-editor');
    template.sections.forEach((sec, sIdx) => {
      const card = document.createElement('section');
      card.className = 'card editor-section';
      card.innerHTML = `
        <div class="editor-section-head">
          <input class="title-input" data-sidx="${sIdx}" value="${escapeAttr(sec.title)}" />
          <div class="row-btns">
            <button class="icon-btn" data-move-sec="${sIdx}" data-dir="-1" ${sIdx === 0 ? 'disabled' : ''}>↑</button>
            <button class="icon-btn" data-move-sec="${sIdx}" data-dir="1" ${sIdx === template.sections.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="icon-btn danger" data-del-sec="${sIdx}">✕</button>
          </div>
        </div>
        <div class="day-picker">
          <span class="day-picker-label">Shows on:</span>
          <div class="day-pills">
            ${DAY_LABELS.map(
              (label, i) => `
              <button type="button" class="day-pill ${sec.days.includes(i) ? 'active' : ''}" data-day="${sIdx}:${i}">${label}</button>`
            ).join('')}
          </div>
          <div class="basis-pills">
            <button type="button" class="basis-pill ${sec.basis !== 'tomorrow' ? 'active' : ''}" data-basis="${sIdx}:today">that day</button>
            <button type="button" class="basis-pill ${sec.basis === 'tomorrow' ? 'active' : ''}" data-basis="${sIdx}:tomorrow">the evening before</button>
          </div>
        </div>
        <ul class="editor-items" data-items-for="${sIdx}">
          ${sec.items
            .map(
              (it, iIdx) => `
            <li class="editor-item" data-sidx="${sIdx}" data-iidx="${iIdx}">
              <input class="item-input" data-item="${sIdx}:${iIdx}" value="${escapeAttr(it.label)}" />
              <button class="icon-btn" data-move-item="${sIdx}:${iIdx}" data-dir="-1" ${iIdx === 0 ? 'disabled' : ''}>↑</button>
              <button class="icon-btn" data-move-item="${sIdx}:${iIdx}" data-dir="1" ${iIdx === sec.items.length - 1 ? 'disabled' : ''}>↓</button>
              <button class="icon-btn danger" data-del-item="${sIdx}:${iIdx}">✕</button>
            </li>`
            )
            .join('')}
        </ul>
        <button class="btn small" data-add-item="${sIdx}">+ Add item</button>
      `;
      editor.appendChild(card);
    });

    container.querySelector('#add-section').onclick = () => {
      const ids = allIds();
      const id = uniqueId(ids, `section-${template.sections.length + 1}`);
      template.sections.push({
        id,
        emoji: '📝',
        title: 'New section',
        days: [0, 1, 2, 3, 4, 5, 6],
        basis: 'today',
        note: null,
        items: [],
      });
      persist();
      draw();
    };

    editor.querySelectorAll('.title-input').forEach((inp) => {
      inp.addEventListener('change', () => {
        const idx = Number(inp.getAttribute('data-sidx'));
        template.sections[idx].title = inp.value.trim() || 'Untitled';
        persist();
      });
    });

    editor.querySelectorAll('[data-day]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [sIdx, dayStr] = btn.getAttribute('data-day').split(':');
        const idx = Number(sIdx);
        const day = Number(dayStr);
        const days = template.sections[idx].days;
        const pos = days.indexOf(day);
        if (pos === -1) days.push(day);
        else days.splice(pos, 1);
        days.sort((a, b) => a - b);
        persist();
        draw();
      });
    });

    editor.querySelectorAll('[data-basis]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [sIdx, basis] = btn.getAttribute('data-basis').split(':');
        template.sections[Number(sIdx)].basis = basis;
        persist();
        draw();
      });
    });

    editor.querySelectorAll('[data-move-sec]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-move-sec'));
        const dir = Number(btn.getAttribute('data-dir'));
        const target = idx + dir;
        if (target < 0 || target >= template.sections.length) return;
        const [s] = template.sections.splice(idx, 1);
        template.sections.splice(target, 0, s);
        persist();
        draw();
      });
    });

    editor.querySelectorAll('[data-del-sec]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-del-sec'));
        if (!confirm(`Delete section "${template.sections[idx].title}" and all its items?`)) return;
        template.sections.splice(idx, 1);
        persist();
        draw();
      });
    });

    editor.querySelectorAll('[data-add-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sIdx = Number(btn.getAttribute('data-add-item'));
        const ids = allIds();
        const id = uniqueId(ids, `item-${Date.now()}`);
        template.sections[sIdx].items.push({ id, label: 'New item', starred: false });
        persist();
        draw();
      });
    });

    editor.querySelectorAll('.item-input').forEach((inp) => {
      inp.addEventListener('change', () => {
        const [sIdx, iIdx] = inp.getAttribute('data-item').split(':').map(Number);
        template.sections[sIdx].items[iIdx].label = inp.value.trim() || 'Untitled';
        persist();
      });
    });

    editor.querySelectorAll('[data-move-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [sIdx, iIdx] = btn.getAttribute('data-move-item').split(':').map(Number);
        const dir = Number(btn.getAttribute('data-dir'));
        const items = template.sections[sIdx].items;
        const target = iIdx + dir;
        if (target < 0 || target >= items.length) return;
        const [it] = items.splice(iIdx, 1);
        items.splice(target, 0, it);
        persist();
        draw();
      });
    });

    editor.querySelectorAll('[data-del-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [sIdx, iIdx] = btn.getAttribute('data-del-item').split(':').map(Number);
        template.sections[sIdx].items.splice(iIdx, 1);
        persist();
        draw();
      });
    });
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  draw();

  return { refresh: draw };
}
