import * as fb from '../firebase.js';
import * as store from '../store.js';
import { toDateKey, addDays } from '../util.js';

const WATER_TARGET = 8;

const NAV_TILES = [
  { key: 'today', emoji: '✅', label: "Today's Routine" },
  { key: 'tasks', emoji: '☑️', label: 'Tasks' },
  { key: 'notes', emoji: '🗒️', label: 'Notes' },
  { key: 'calendar', emoji: '📅', label: 'Calendar' },
  { key: 'settings', emoji: '⚙️', label: 'Settings' },
];

export function renderHome(container, { userEmail, onNav }) {
  const uid = store.currentUid();
  const dateKey = toDateKey(new Date());
  let water = { count: 0 };
  let weightToday = null;
  let recentWeights = {};

  const unwatchWater = fb.watchWater(uid, dateKey, (data) => {
    water = data;
    drawWater();
  });

  async function loadWeight() {
    const [today, recent] = await Promise.all([
      fb.fetchWeight(uid, dateKey),
      fb.fetchWeightInRange(uid, toDateKey(addDays(new Date(), -13)), dateKey),
    ]);
    weightToday = today;
    recentWeights = recent;
    drawWeight();
  }
  loadWeight().catch((e) => console.warn('Could not load weight history', e));

  const namePart = (userEmail || '').split('@')[0];
  const greetName = namePart ? namePart.charAt(0).toUpperCase() + namePart.slice(1) : 'there';

  function draw() {
    container.innerHTML = `
      <div class="home-greeting"><h2>Hey ${greetName} 👋</h2></div>

      <div class="tracker-row">
        <div class="card tracker-card">
          <div class="tracker-head"><span>💧 Water</span><span id="water-count"></span></div>
          <div class="tracker-dots" id="water-dots"></div>
          <div class="tracker-btns">
            <button class="btn small" id="water-minus">−</button>
            <button class="btn small primary" id="water-plus">+ Glass</button>
          </div>
        </div>

        <div class="card tracker-card">
          <div class="tracker-head"><span>⚖️ Weight</span><span id="weight-trend"></span></div>
          <form id="weight-form" class="weight-form">
            <input type="number" step="0.1" min="0" inputmode="decimal" id="weight-input" placeholder="kg" />
            <button class="btn small primary" type="submit">Save</button>
          </form>
        </div>
      </div>

      <div class="nav-grid">
        ${NAV_TILES.map((t) => `<button class="nav-tile" data-nav="${t.key}"><span class="nav-tile-emoji">${t.emoji}</span><span>${t.label}</span></button>`).join('')}
      </div>
    `;

    container.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => onNav(btn.getAttribute('data-nav')));
    });

    container.querySelector('#water-plus').addEventListener('click', () => {
      fb.addWaterGlasses(uid, dateKey, 1);
    });
    container.querySelector('#water-minus').addEventListener('click', () => {
      if ((water.count || 0) > 0) fb.addWaterGlasses(uid, dateKey, -1);
    });

    container.querySelector('#weight-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = container.querySelector('#weight-input');
      const value = parseFloat(input.value);
      if (!value || Number.isNaN(value)) return;
      await fb.saveWeight(uid, dateKey, value, 'kg');
      await loadWeight();
    });

    drawWater();
    drawWeight();
  }

  function drawWater() {
    const countEl = container.querySelector('#water-count');
    const dotsEl = container.querySelector('#water-dots');
    const minusBtn = container.querySelector('#water-minus');
    if (!countEl) return;
    const count = water.count || 0;
    countEl.textContent = `${count} / ${WATER_TARGET}`;
    dotsEl.innerHTML = Array.from({ length: Math.max(count, WATER_TARGET) })
      .map((_, i) => `<span class="water-dot ${i < count ? 'filled' : ''}">💧</span>`)
      .join('');
    if (minusBtn) minusBtn.disabled = count <= 0;
  }

  function drawWeight() {
    const input = container.querySelector('#weight-input');
    const trendEl = container.querySelector('#weight-trend');
    if (!input) return;
    if (weightToday && document.activeElement !== input) input.value = weightToday.value;

    const priorDate = Object.keys(recentWeights)
      .filter((d) => d < dateKey)
      .sort()
      .pop();
    if (weightToday && priorDate) {
      const diff = weightToday.value - recentWeights[priorDate].value;
      const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
      trendEl.textContent = `${arrow} ${Math.abs(diff).toFixed(1)} kg`;
      trendEl.className = diff > 0 ? 'trend-up' : diff < 0 ? 'trend-down' : 'trend-flat';
    } else {
      trendEl.textContent = '';
      trendEl.className = '';
    }
  }

  draw();

  return {
    refresh: draw,
    destroy: unwatchWater,
  };
}
