import { RUN_DAYS } from './data.js';

export function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d, n) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function isRunDay(d) {
  return RUN_DAYS.includes(d.getDay());
}

export function isSunday(d) {
  return d.getDay() === 0;
}

// Returns the list of sections (from a template) that apply on date `d`.
export function sectionsForDate(template, d) {
  const runToday = isRunDay(d);
  const runTomorrow = isRunDay(addDays(d, 1));
  return template.sections.filter((s) => {
    switch (s.condition) {
      case 'always':
        return true;
      case 'notRunday':
        return !runToday;
      case 'runday':
        return runToday;
      case 'tomorrowRunday':
        return !runToday && runTomorrow;
      case 'sunday':
        return isSunday(d);
      default:
        return true;
    }
  });
}

export function friendlyDate(d) {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function monthLabel(d) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
