import * as fb from './firebase.js';
import * as store from './store.js';
import { toDateKey } from './util.js';
import { renderToday } from './views/today.js';
import { renderCalendar } from './views/calendar.js';
import { renderSettings } from './views/settings.js';

const root = document.getElementById('app-root');

function screen(html) {
  root.innerHTML = `<div class="screen">${html}</div>`;
}

// Accepts whatever Firebase's console actually shows you — the whole code
// sample (imports, initializeApp call, comments and all) or just the
// firebaseConfig object by itself, with unquoted keys and a trailing
// semicolon — not just strict JSON, since that's what someone will really
// copy-paste. Finds the "firebaseConfig = { ... }" object by matching
// balanced braces rather than assuming it's the only thing pasted in.
function parseFirebaseConfigText(raw) {
  const text = raw || '';
  if (!text.trim()) throw new Error('Paste your Firebase config first.');
  const marker = text.indexOf('firebaseConfig');
  const braceStart = text.indexOf('{', marker === -1 ? 0 : marker);
  if (braceStart === -1) {
    throw new Error("That doesn't look like a config — it should contain a { ... } block.");
  }
  let depth = 0;
  let braceEnd = -1;
  for (let i = braceStart; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        braceEnd = i;
        break;
      }
    }
  }
  if (braceEnd === -1) {
    throw new Error("Found the start of the config but not its closing '}' — make sure you copied the whole block.");
  }
  let obj = text.slice(braceStart, braceEnd + 1);
  obj = obj.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (m, inner) => '"' + inner.replace(/"/g, '\\"') + '"');
  obj = obj.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)(\s*:)/g, '$1"$2"$3');
  obj = obj.replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(obj);
}

async function boot() {
  const config = fb.getStoredConfig();
  if (!config) {
    showConfigScreen();
    return;
  }
  try {
    await fb.initFirebase(config);
  } catch (e) {
    showConfigScreen(`Could not initialize Firebase: ${e.message}`);
    return;
  }
  fb.onAuthChange(async (user) => {
    if (user) {
      await store.initForUser(user.uid);
      showApp(user);
    } else {
      showSignIn();
    }
  });
}

function showConfigScreen(error) {
  screen(`
    <div class="config-card">
      <h1>Connect your private space</h1>
      <p>This app stores your data in a Firebase project that belongs to <em>you</em> — nobody else can read it. If you haven't made one yet, follow <code>SETUP.md</code> in the repo (Step 4). Then come back here, select <strong>all</strong> of the <code>firebaseConfig</code> block Firebase showed you, copy it, and paste it below exactly as it was shown — you don't need to edit or clean it up first.</p>
      ${error ? `<p class="error">${error}</p>` : ''}
      <textarea id="config-input" rows="8" placeholder='const firebaseConfig = {&#10;  apiKey: "...",&#10;  authDomain: "...",&#10;  ...&#10;};'></textarea>
      <button class="btn primary" id="save-config">Save & continue</button>
    </div>
  `);
  document.getElementById('save-config').onclick = () => {
    const raw = document.getElementById('config-input').value;
    try {
      const parsed = parseFirebaseConfigText(raw);
      if (!parsed.apiKey || !parsed.projectId) throw new Error("That's missing apiKey or projectId — make sure you copied the whole block.");
      fb.setStoredConfig(parsed);
      boot();
    } catch (e) {
      showConfigScreen(`That doesn't look like a valid Firebase config: ${e.message}`);
    }
  };
}

function showSignIn(error) {
  screen(`
    <div class="config-card">
      <h1>Sign in</h1>
      <p>This is a private, single-account app. Create your one account from the Firebase console (see SETUP.md), then sign in here.</p>
      ${error ? `<p class="error">${error}</p>` : ''}
      <input id="email" type="email" placeholder="you@example.com" autocomplete="username" />
      <input id="password" type="password" placeholder="Password" autocomplete="current-password" />
      <button class="btn primary" id="do-signin">Sign in</button>
      <button class="link-btn" id="forgot">Forgot password?</button>
      <button class="link-btn" id="reconfig">Use a different Firebase project</button>
    </div>
  `);
  document.getElementById('do-signin').onclick = async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      await fb.signIn(email, password);
    } catch (e) {
      showSignIn(e.message);
    }
  };
  document.getElementById('forgot').onclick = async () => {
    const email = document.getElementById('email').value.trim();
    if (!email) {
      showSignIn('Enter your email above first, then tap "Forgot password?" again.');
      return;
    }
    try {
      await fb.sendPasswordReset(email);
      showSignIn('Password reset email sent.');
    } catch (e) {
      showSignIn(e.message);
    }
  };
  document.getElementById('reconfig').onclick = () => {
    fb.clearStoredConfig();
    showConfigScreen();
  };
}

function showApp(user) {
  root.innerHTML = `
    <div class="app-shell">
      <header class="app-header">
        <span class="app-name">🐌 Daily Routine</span>
      </header>
      <main id="view" class="view"></main>
      <nav class="tab-bar">
        <button class="tab active" data-tab="today">✅<span>Today</span></button>
        <button class="tab" data-tab="calendar">📅<span>Calendar</span></button>
        <button class="tab" data-tab="settings">⚙️<span>Settings</span></button>
      </nav>
    </div>
  `;

  const view = document.getElementById('view');
  const tabs = Array.from(document.querySelectorAll('.tab'));

  function setActiveTab(name) {
    tabs.forEach((t) => t.classList.toggle('active', t.getAttribute('data-tab') === name));
  }

  function showToday(dateKey) {
    setActiveTab('today');
    renderToday(view, dateKey || toDateKey(new Date()));
  }

  function showCalendar() {
    setActiveTab('calendar');
    renderCalendar(view, (dateKey) => showToday(dateKey));
  }

  function showSettings() {
    setActiveTab('settings');
    renderSettings(view, {
      userEmail: user.email,
      onSignOut: async () => {
        await fb.signOutUser();
      },
      onReconfigure: () => {
        fb.clearStoredConfig();
        location.reload();
      },
    });
  }

  tabs.forEach((t) => {
    t.addEventListener('click', () => {
      const name = t.getAttribute('data-tab');
      if (name === 'today') showToday();
      if (name === 'calendar') showCalendar();
      if (name === 'settings') showSettings();
    });
  });

  showToday();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch((e) => console.warn('SW registration failed', e));
  });
}

boot();
