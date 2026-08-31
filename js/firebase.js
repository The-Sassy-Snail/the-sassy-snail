// Thin wrapper around the Firebase modular SDK (loaded from CDN).
// Nothing here talks to Anthropic or any third party except the Firebase
// project *you* create and configure — see SETUP.md.

const SDK_VERSION = '10.14.1';
const CONFIG_KEY = 'sb-firebase-config';

let appPromise = null;

async function loadSdk() {
  const base = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;
  const [appMod, authMod, fsMod] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`),
  ]);
  return { appMod, authMod, fsMod };
}

export function getStoredConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function clearStoredConfig() {
  localStorage.removeItem(CONFIG_KEY);
}

let ctx = null; // { appMod, authMod, fsMod, app, auth, db }

export async function initFirebase(config) {
  if (ctx) return ctx;
  const { appMod, authMod, fsMod } = await loadSdk();
  const app = appMod.initializeApp(config);
  const auth = authMod.getAuth(app);
  const db = fsMod.getFirestore(app);
  try {
    await fsMod.enableIndexedDbPersistence(db);
  } catch (e) {
    // multiple tabs open, or browser doesn't support it — fine, app still works online
    console.warn('Offline persistence unavailable:', e.code || e);
  }
  ctx = { appMod, authMod, fsMod, app, auth, db };
  return ctx;
}

export function onAuthChange(cb) {
  const { authMod, auth } = ctx;
  return authMod.onAuthStateChanged(auth, cb);
}

export async function signIn(email, password) {
  const { authMod, auth } = ctx;
  return authMod.signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  const { authMod, auth } = ctx;
  return authMod.signOut(auth);
}

export async function sendPasswordReset(email) {
  const { authMod, auth } = ctx;
  return authMod.sendPasswordResetEmail(auth, email);
}

function templateDocRef(uid) {
  const { fsMod, db } = ctx;
  return fsMod.doc(db, 'users', uid, 'meta', 'template');
}

function logDocRef(uid, dateKey) {
  const { fsMod, db } = ctx;
  return fsMod.doc(db, 'users', uid, 'logs', dateKey);
}

export async function fetchTemplate(uid) {
  const { fsMod } = ctx;
  const snap = await fsMod.getDoc(templateDocRef(uid));
  return snap.exists() ? snap.data() : null;
}

export async function writeTemplate(uid, template) {
  const { fsMod } = ctx;
  await fsMod.setDoc(templateDocRef(uid), {
    ...template,
    updatedAt: fsMod.serverTimestamp(),
  });
}

export async function fetchDayLog(uid, dateKey) {
  const { fsMod } = ctx;
  const snap = await fsMod.getDoc(logDocRef(uid, dateKey));
  return snap.exists() ? snap.data() : { checked: {} };
}

export async function writeDayLog(uid, dateKey, checked) {
  const { fsMod } = ctx;
  await fsMod.setDoc(logDocRef(uid, dateKey), {
    checked,
    updatedAt: fsMod.serverTimestamp(),
  });
}

export function watchDayLog(uid, dateKey, cb) {
  const { fsMod } = ctx;
  return fsMod.onSnapshot(logDocRef(uid, dateKey), (snap) => {
    cb(snap.exists() ? snap.data() : { checked: {} });
  });
}

export async function fetchLogsInRange(uid, startKey, endKey) {
  const { fsMod, db } = ctx;
  const col = fsMod.collection(db, 'users', uid, 'logs');
  const q = fsMod.query(
    col,
    fsMod.where(fsMod.documentId(), '>=', startKey),
    fsMod.where(fsMod.documentId(), '<=', endKey)
  );
  const snap = await fsMod.getDocs(q);
  const result = {};
  snap.forEach((d) => {
    result[d.id] = d.data();
  });
  return result;
}
