import * as fb from '../firebase.js';
import * as store from '../store.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatWhen(ts) {
  if (!ts || typeof ts.toDate !== 'function') return 'Just now';
  return ts.toDate().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function renderNotes(container) {
  let notes = [];
  let editingId = null;
  const uid = store.currentUid();

  const unwatch = fb.watchNotes(uid, (rows) => {
    notes = rows;
    draw();
  });

  function noteCardHtml(n) {
    if (editingId === n.id) {
      return `
        <div class="note-card" data-id="${n.id}">
          <textarea class="note-edit-input" rows="4">${escapeHtml(n.text)}</textarea>
          <div class="note-edit-actions">
            <button class="btn small primary" data-note-save="${n.id}">Save</button>
            <button class="btn small" data-note-cancel="${n.id}">Cancel</button>
          </div>
        </div>`;
    }
    return `
      <div class="note-card" data-id="${n.id}">
        <p class="note-text">${escapeHtml(n.text)}</p>
        <div class="note-meta">
          <span>${formatWhen(n.updatedAt || n.createdAt)}</span>
          <span class="note-actions">
            <button class="link-btn" data-note-edit="${n.id}">Edit</button>
            <button class="link-btn" data-note-del="${n.id}">Delete</button>
          </span>
        </div>
      </div>`;
  }

  function draw() {
    container.innerHTML = `
      <h2>Notes</h2>
      <p class="hint">Brain dumps, journal entries, anything you want to remember.</p>
      <form id="add-note-form" class="add-note">
        <textarea id="new-note-text" rows="3" placeholder="What's on your mind?" required></textarea>
        <button class="btn primary" type="submit">Save note</button>
      </form>
      <div class="notes-list">
        ${notes.length ? notes.map(noteCardHtml).join('') : '<p class="empty-hint">No notes yet.</p>'}
      </div>
    `;

    container.querySelector('#add-note-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = container.querySelector('#new-note-text');
      const text = input.value.trim();
      if (!text) return;
      await fb.addNote(uid, text);
      input.value = '';
    });

    container.querySelectorAll('[data-note-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingId = btn.getAttribute('data-note-edit');
        draw();
        const ta = container.querySelector('.note-edit-input');
        if (ta) ta.focus();
      });
    });

    container.querySelectorAll('[data-note-cancel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingId = null;
        draw();
      });
    });

    container.querySelectorAll('[data-note-save]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-note-save');
        const card = container.querySelector(`.note-card[data-id="${id}"]`);
        const text = card.querySelector('.note-edit-input').value.trim();
        if (text) await fb.updateNote(uid, id, text);
        editingId = null;
        draw();
      });
    });

    container.querySelectorAll('[data-note-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this note?')) return;
        fb.deleteNote(uid, btn.getAttribute('data-note-del'));
      });
    });
  }

  draw();

  return {
    refresh: draw,
    destroy: unwatch,
  };
}
