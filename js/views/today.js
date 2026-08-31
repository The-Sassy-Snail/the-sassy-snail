import * as store from '../store.js';
import { toDateKey, fromDateKey, addDays, friendlyDate } from '../util.js';

function collapseKey(sectionId) {
  return `sb-collapsed-${sectionId}`;
}

function isCollapsed(sectionId) {
  return localStorage.getItem(collapseKey(sectionId)) === '1';
}

function setCollapsed(sectionId, val) {
  if (val) localStorage.setItem(collapseKey(sectionId), '1');
  else localStorage.removeItem(collapseKey(sectionId));
}

const CONFETTI_COLORS = ['#d97757', '#eab04a', '#a9bf9f', '#e8a187', '#f3d3bd'];

function celebrate() {
  const banner = document.createElement('div');
  banner.className = 'celebrate-banner';
  banner.textContent = '🎉 Day complete — nice work!';
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('show'));
  setTimeout(() => {
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 350);
  }, 2200);

  for (let i = 0; i < 24; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.animationDuration = `${1.4 + Math.random() * 1.2}s`;
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    document.body.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

export function renderToday(container, initialDateKey, opts = {}) {
  let dateKey = initialDateKey || toDateKey(new Date());
  let unwatch = null;

  async function draw() {
    if (unwatch) unwatch();
    const date = fromDateKey(dateKey);
    const sections = store.sectionsForKey(dateKey);
    const dayLog = await store.loadDay(dateKey);
    const todayKey = toDateKey(new Date());
    const editable = opts.alwaysEditable !== false; // by default every day is editable

    const badges = [];
    if (dateKey === todayKey) badges.push('📍 Today');

    container.innerHTML = `
      <div class="day-header">
        <button class="nav-btn" id="prev-day" aria-label="Previous day">‹</button>
        <div class="day-title">
          <h2>${friendlyDate(date)}</h2>
          <div class="badges">${badges.map((b) => `<span class="badge">${b}</span>`).join('')}</div>
        </div>
        <button class="nav-btn" id="next-day" aria-label="Next day">›</button>
      </div>
      ${dateKey !== todayKey ? `<button class="link-btn" id="jump-today">Jump to today</button>` : ''}
      <div class="overall-progress"><div class="bar"><div class="fill" id="overall-fill"></div></div><span id="overall-label"></span></div>
      <div id="sections"></div>
    `;

    const sectionsEl = container.querySelector('#sections');
    let totalAll = 0;
    let doneAll = 0;

    for (const s of sections) {
      const total = s.items.length;
      const done = s.items.filter((it) => dayLog.checked && dayLog.checked[it.id]).length;
      totalAll += total;
      doneAll += done;
      const collapsed = isCollapsed(s.id);

      const card = document.createElement('section');
      card.className = 'card' + (collapsed ? ' collapsed' : '');
      card.innerHTML = `
        <button class="card-head" data-section="${s.id}">
          <span class="card-title">${s.emoji} ${s.title}</span>
          <span class="card-progress">${done}/${total}</span>
          <span class="chev">${collapsed ? '▸' : '▾'}</span>
        </button>
        ${s.note ? `<p class="section-note">${s.note}</p>` : ''}
        <ul class="items">
          ${s.items
            .map(
              (it) => `
            <li class="item">
              <label>
                <input type="checkbox" data-item="${it.id}" ${dayLog.checked && dayLog.checked[it.id] ? 'checked' : ''} ${!editable ? 'disabled' : ''} />
                <span class="item-label">${it.label}</span>
              </label>
            </li>`
            )
            .join('')}
        </ul>
      `;
      sectionsEl.appendChild(card);
    }

    updateOverall(doneAll, totalAll);

    container.querySelector('#prev-day').onclick = () => {
      dateKey = toDateKey(addDays(date, -1));
      draw();
    };
    container.querySelector('#next-day').onclick = () => {
      dateKey = toDateKey(addDays(date, 1));
      draw();
    };
    const jump = container.querySelector('#jump-today');
    if (jump) jump.onclick = () => {
      dateKey = todayKey;
      draw();
    };

    sectionsEl.querySelectorAll('.card-head').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-section');
        const nowCollapsed = !isCollapsed(id);
        setCollapsed(id, nowCollapsed);
        draw();
      });
    });

    sectionsEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener('change', async () => {
        const itemId = cb.getAttribute('data-item');
        await store.setChecked(dateKey, itemId, cb.checked);
        const li = cb.closest('.card');
        const label = li.querySelector('.card-progress');
        const checks = li.querySelectorAll('input[type="checkbox"]');
        const doneNow = Array.from(checks).filter((c) => c.checked).length;
        label.textContent = `${doneNow}/${checks.length}`;
        recomputeOverall();
      });
    });

    function recomputeOverall() {
      const allBoxes = sectionsEl.querySelectorAll('input[type="checkbox"]');
      const total = allBoxes.length;
      const done = Array.from(allBoxes).filter((c) => c.checked).length;
      updateOverall(done, total);
      if (total > 0 && done === total) celebrate();
    }
  }

  function updateOverall(done, total) {
    const fill = container.querySelector('#overall-fill');
    const label = container.querySelector('#overall-label');
    const pct = total ? Math.round((done / total) * 100) : 0;
    if (fill) fill.style.width = `${pct}%`;
    if (label) label.textContent = `${done}/${total} (${pct}%)`;
  }

  draw();

  return {
    setDate(key) {
      dateKey = key;
      draw();
    },
    refresh: draw,
  };
}
