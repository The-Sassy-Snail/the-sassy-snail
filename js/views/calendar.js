import * as store from '../store.js';
import { toDateKey, monthLabel } from '../util.js';

const DONE_THRESHOLD = 0.7;

function shadeFor(pct) {
  if (pct <= 0) return 0;
  if (pct < 0.3) return 1;
  if (pct < DONE_THRESHOLD) return 2;
  if (pct < 1) return 3;
  return 4;
}

export function renderCalendar(container, onSelectDate) {
  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth(); // 0-indexed

  async function draw() {
    container.innerHTML = `
      <div class="cal-header">
        <button class="nav-btn" id="prev-month">‹</button>
        <h2>${monthLabel(new Date(viewYear, viewMonth, 1))}</h2>
        <button class="nav-btn" id="next-month">›</button>
      </div>
      <div class="streak-row" id="streak-row">Loading streak…</div>
      <div class="cal-grid" id="cal-grid">Loading…</div>
      <div class="cal-legend">
        <span>Less</span>
        <span class="swatch shade-0"></span>
        <span class="swatch shade-1"></span>
        <span class="swatch shade-2"></span>
        <span class="swatch shade-3"></span>
        <span class="swatch shade-4"></span>
        <span>More</span>
      </div>
    `;

    container.querySelector('#prev-month').onclick = () => {
      viewMonth -= 1;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear -= 1;
      }
      draw();
    };
    container.querySelector('#next-month').onclick = () => {
      viewMonth += 1;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear += 1;
      }
      draw();
    };

    const summary = await store.getMonthSummary(viewYear, viewMonth);
    renderGrid(summary);
    renderStreak();
  }

  function renderGrid(summary) {
    const grid = container.querySelector('#cal-grid');
    const first = new Date(viewYear, viewMonth, 1);
    const startPad = first.getDay(); // 0 = Sunday
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayKey = toDateKey(today);

    const dow = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    let html = dow.map((d) => `<div class="cal-dow">${d}</div>`).join('');

    for (let i = 0; i < startPad; i++) {
      html += `<div class="cal-cell empty"></div>`;
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      const key = toDateKey(d);
      const stat = summary[key] || { done: 0, total: 0, pct: 0 };
      const shade = shadeFor(stat.pct);
      const isToday = key === todayKey;
      html += `
        <button class="cal-cell shade-${shade} ${isToday ? 'is-today' : ''}" data-date="${key}" title="${stat.done}/${stat.total} done">
          <span class="cal-day-num">${day}</span>
        </button>`;
    }
    grid.innerHTML = html;

    grid.querySelectorAll('.cal-cell[data-date]').forEach((cell) => {
      cell.addEventListener('click', () => {
        onSelectDate(cell.getAttribute('data-date'));
      });
    });
  }

  async function renderStreak() {
    const el = container.querySelector('#streak-row');
    const summary = await store.getRecentSummary(60);
    const keys = Object.keys(summary).sort();
    keys.reverse();
    let streak = 0;
    for (const k of keys) {
      if (summary[k].total > 0 && summary[k].pct >= DONE_THRESHOLD) {
        streak += 1;
      } else if (k === toDateKey(today)) {
        continue; // don't break streak just because today isn't finished yet
      } else {
        break;
      }
    }
    el.innerHTML = streak > 0
      ? `🔥 <strong>${streak}-day streak</strong> (${Math.round(DONE_THRESHOLD * 100)}%+ completed)`
      : `Complete ${Math.round(DONE_THRESHOLD * 100)}%+ of a day to start a streak`;
  }

  draw();

  return { refresh: draw };
}
