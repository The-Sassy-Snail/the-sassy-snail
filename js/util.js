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

// Returns the list of sections (from a template) that apply on date `d`,
// based on each section's own weekday picker (`days`) and whether it's
// evaluated against that date or the day before (`basis`).
export function sectionsForDate(template, d) {
  return template.sections.filter((s) => {
    const days = s.days || [0, 1, 2, 3, 4, 5, 6];
    const target = s.basis === 'tomorrow' ? addDays(d, 1) : d;
    return days.includes(target.getDay());
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
