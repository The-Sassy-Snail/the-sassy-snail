import * as store from '../store.js';
import { slugify } from '../data.js';

const CONDITIONS = [
  { value: 'always', label: 'Every day' },
  { value: 'notRunday', label: 'Non-run days only' },
  { value: 'runday', label: 'Run days only (Tue/Thu/Sun)' },
  { value: 'tomorrowRunday', label: 'When tomorrow is a run day' },
  { value: 'sunday', label: 'Sundays only' },
];

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

export function renderSettings(container, { onSignOut, onReconfigure, userEmail }) {
  let template = JSON.parse(JSON.stringify(store.getTemplate()));

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
      <h2>Edit your routine</h2>
      <p class="hint">Changes sync to every device you're signed into. Section visibility controls when a section shows up.</p>
      <div id="sections-editor"></div>
      <button class="btn" id="add-section">+ Add section</button>
    `;

    container.querySelector('#btn-signout').onclick = onSignOut;
    container.querySelector('#btn-reconfigure').onclick = onReconfigure;

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
        <label class="cond-label">Shows:
          <select data-cond="${sIdx}">
            ${CONDITIONS.map((c) => `<option value="${c.value}" ${c.value === sec.condition ? 'selected' : ''}>${c.label}</option>`).join('')}
          </select>
        </label>
        <ul class="editor-items" data-items-for="${sIdx}">
          ${sec.items
            .map(
              (it, iIdx) => `
            <li class="editor-item" data-sidx="${sIdx}" data-iidx="${iIdx}">
              <button class="icon-btn star-toggle ${it.starred ? 'active' : ''}" data-star="${sIdx}:${iIdx}">⭐</button>
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
      template.sections.push({ id, emoji: '📝', title: 'New section', condition: 'always', note: null, items: [] });
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

    editor.querySelectorAll('select[data-cond]').forEach((sel) => {
      sel.addEventListener('change', () => {
        const idx = Number(sel.getAttribute('data-cond'));
        template.sections[idx].condition = sel.value;
        persist();
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

    editor.querySelectorAll('.star-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [sIdx, iIdx] = btn.getAttribute('data-star').split(':').map(Number);
        const it = template.sections[sIdx].items[iIdx];
        it.starred = !it.starred;
        persist();
        draw();
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
