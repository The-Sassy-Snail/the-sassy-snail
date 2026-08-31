import * as fb from '../firebase.js';
import * as store from '../store.js';
import { toDateKey } from '../util.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sortIncomplete(a, b) {
  if (a.dueDate && b.dueDate) return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return 0; // keep createdAt-desc order (already sorted by Firestore) for undated tasks
}

export function renderTasks(container) {
  let tasks = [];
  let showCompleted = false;
  const uid = store.currentUid();

  const unwatch = fb.watchTasks(uid, (rows) => {
    tasks = rows;
    draw();
  });

  function taskItemHtml(t) {
    const todayKey = toDateKey(new Date());
    let dueBadge = '';
    if (t.dueDate) {
      const overdue = !t.done && t.dueDate < todayKey;
      const dueToday = t.dueDate === todayKey;
      dueBadge = `<span class="due-badge ${overdue ? 'overdue' : ''} ${dueToday ? 'due-today' : ''}">${t.dueDate === todayKey ? 'Today' : t.dueDate}</span>`;
    }
    return `
      <li class="task-item" data-id="${t.id}">
        <label>
          <input type="checkbox" data-task-toggle="${t.id}" ${t.done ? 'checked' : ''} />
          <span class="task-text">${escapeHtml(t.text)}</span>
        </label>
        ${dueBadge}
        <button class="icon-btn danger" data-task-del="${t.id}">✕</button>
      </li>`;
  }

  function draw() {
    const incomplete = tasks.filter((t) => !t.done).sort(sortIncomplete);
    const completed = tasks.filter((t) => t.done);

    container.innerHTML = `
      <h2>Tasks</h2>
      <p class="hint">One-off things to do — separate from your daily routine.</p>
      <form id="add-task-form" class="add-row">
        <input type="text" id="new-task-text" placeholder="Add a task…" required />
        <input type="date" id="new-task-due" />
        <button class="btn primary" type="submit">Add</button>
      </form>
      <ul class="task-list">
        ${incomplete.length ? incomplete.map(taskItemHtml).join('') : '<li class="empty-hint">Nothing on your list 🎈</li>'}
      </ul>
      ${
        completed.length
          ? `<button class="link-btn" id="toggle-completed">${showCompleted ? 'Hide' : 'Show'} completed (${completed.length})</button>
             ${showCompleted ? `<ul class="task-list completed">${completed.map(taskItemHtml).join('')}</ul>` : ''}`
          : ''
      }
    `;

    container.querySelector('#add-task-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const textInput = container.querySelector('#new-task-text');
      const dueInput = container.querySelector('#new-task-due');
      const text = textInput.value.trim();
      if (!text) return;
      await fb.addTask(uid, text, dueInput.value || null);
      textInput.value = '';
      dueInput.value = '';
      textInput.focus();
    });

    container.querySelectorAll('[data-task-toggle]').forEach((cb) => {
      cb.addEventListener('change', () => {
        fb.updateTask(uid, cb.getAttribute('data-task-toggle'), { done: cb.checked });
      });
    });

    container.querySelectorAll('[data-task-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        fb.deleteTask(uid, btn.getAttribute('data-task-del'));
      });
    });

    const toggleBtn = container.querySelector('#toggle-completed');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        showCompleted = !showCompleted;
        draw();
      });
    }
  }

  draw();

  return {
    refresh: draw,
    destroy: unwatch,
  };
}
