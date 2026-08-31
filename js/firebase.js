// Thin wrapper around the Firebase modular SDK (loaded from CDN).
// Nothing here talks to Anthropic or any third party except the Firebase
// project *you* create and configure — see SETUP.md.

const SDK_VERSION = '10.14.1';
const CONFIG_KEY = 'sb-firebase-config';
const VAPID_KEY_STORAGE = 'sb-vapid-key';

export function getStoredVapidKey() {
  return localStorage.getItem(VAPID_KEY_STORAGE) || '';
}

export function setStoredVapidKey(key) {
  localStorage.setItem(VAPID_KEY_STORAGE, key);
}

let appPromise = null;

async function loadSdk() {
  const base = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;
  const [appMod, authMod, fsMod, msgMod] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`),
    import(`${base}/firebase-messaging.js`),
  ]);
  return { appMod, authMod, fsMod, msgMod };
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

let ctx = null; // { appMod, authMod, fsMod, msgMod, app, auth, db }

export async function initFirebase(config) {
  if (ctx) return ctx;
  const { appMod, authMod, fsMod, msgMod } = await loadSdk();
  const app = appMod.initializeApp(config);
  const auth = authMod.getAuth(app);
  const db = fsMod.getFirestore(app);
  try {
    await fsMod.enableIndexedDbPersistence(db);
  } catch (e) {
    // multiple tabs open, or browser doesn't support it — fine, app still works online
    console.warn('Offline persistence unavailable:', e.code || e);
  }
  ctx = { appMod, authMod, fsMod, msgMod, app, auth, db };
  return ctx;
}

// Requests notification permission and returns an FCM registration token for
// this device, or null if the browser doesn't support push (e.g. iOS Safari
// not installed to the home screen) or the user declines permission.
export async function requestNotificationToken(vapidKey, swRegistration) {
  const { msgMod, app } = ctx;
  const supported = await msgMod.isSupported().catch(() => false);
  if (!supported) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const messaging = msgMod.getMessaging(app);
  return msgMod.getToken(messaging, { vapidKey, serviceWorkerRegistration: swRegistration });
}

export function onForegroundMessage(cb) {
  const { msgMod, app } = ctx;
  const messaging = msgMod.getMessaging(app);
  return msgMod.onMessage(messaging, cb);
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

function notifyDocRef(uid) {
  const { fsMod, db } = ctx;
  return fsMod.doc(db, 'users', uid, 'meta', 'notify');
}

export async function fetchNotifySettings(uid) {
  const { fsMod } = ctx;
  const snap = await fsMod.getDoc(notifyDocRef(uid));
  return snap.exists() ? snap.data() : null;
}

export async function writeNotifySettings(uid, settings) {
  const { fsMod } = ctx;
  await fsMod.setDoc(notifyDocRef(uid), settings, { merge: true });
}

export async function addDeviceToken(uid, token) {
  const { fsMod } = ctx;
  await fsMod.setDoc(
    notifyDocRef(uid),
    { tokens: fsMod.arrayUnion(token) },
    { merge: true }
  );
}

export async function removeDeviceToken(uid, token) {
  const { fsMod } = ctx;
  await fsMod.setDoc(
    notifyDocRef(uid),
    { tokens: fsMod.arrayRemove(token) },
    { merge: true }
  );
}

// ---- tasks (one-off to-dos, separate from the recurring daily routine) ----

function tasksCol(uid) {
  const { fsMod, db } = ctx;
  return fsMod.collection(db, 'users', uid, 'tasks');
}

export function watchTasks(uid, cb) {
  const { fsMod } = ctx;
  const q = fsMod.query(tasksCol(uid), fsMod.orderBy('createdAt', 'desc'));
  return fsMod.onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })));
  });
}

export async function addTask(uid, text, dueDate) {
  const { fsMod } = ctx;
  await fsMod.addDoc(tasksCol(uid), {
    text,
    dueDate: dueDate || null,
    done: false,
    createdAt: fsMod.serverTimestamp(),
  });
}

export async function updateTask(uid, taskId, patch) {
  const { fsMod, db } = ctx;
  await fsMod.updateDoc(fsMod.doc(db, 'users', uid, 'tasks', taskId), patch);
}

export async function deleteTask(uid, taskId) {
  const { fsMod, db } = ctx;
  await fsMod.deleteDoc(fsMod.doc(db, 'users', uid, 'tasks', taskId));
}

// ---- notes / journal ----

function notesCol(uid) {
  const { fsMod, db } = ctx;
  return fsMod.collection(db, 'users', uid, 'notes');
}

export function watchNotes(uid, cb) {
  const { fsMod } = ctx;
  const q = fsMod.query(notesCol(uid), fsMod.orderBy('createdAt', 'desc'));
  return fsMod.onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })));
  });
}

export async function addNote(uid, text) {
  const { fsMod } = ctx;
  await fsMod.addDoc(notesCol(uid), {
    text,
    createdAt: fsMod.serverTimestamp(),
    updatedAt: fsMod.serverTimestamp(),
  });
}

export async function updateNote(uid, noteId, text) {
  const { fsMod, db } = ctx;
  await fsMod.updateDoc(fsMod.doc(db, 'users', uid, 'notes', noteId), {
    text,
    updatedAt: fsMod.serverTimestamp(),
  });
}

export async function deleteNote(uid, noteId) {
  const { fsMod, db } = ctx;
  await fsMod.deleteDoc(fsMod.doc(db, 'users', uid, 'notes', noteId));
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

// ---- water tracker (one doc per day, a running glass count) ----

function waterDocRef(uid, dateKey) {
  const { fsMod, db } = ctx;
  return fsMod.doc(db, 'users', uid, 'water', dateKey);
}

export function watchWater(uid, dateKey, cb) {
  const { fsMod } = ctx;
  return fsMod.onSnapshot(waterDocRef(uid, dateKey), (snap) => {
    cb(snap.exists() ? snap.data() : { count: 0 });
  });
}

export async function addWaterGlasses(uid, dateKey, delta) {
  const { fsMod } = ctx;
  await fsMod.setDoc(
    waterDocRef(uid, dateKey),
    { count: fsMod.increment(delta), updatedAt: fsMod.serverTimestamp() },
    { merge: true }
  );
}

// ---- weight tracker (one doc per day) ----

function weightDocRef(uid, dateKey) {
  const { fsMod, db } = ctx;
  return fsMod.doc(db, 'users', uid, 'weight', dateKey);
}

export async function fetchWeight(uid, dateKey) {
  const { fsMod } = ctx;
  const snap = await fsMod.getDoc(weightDocRef(uid, dateKey));
  return snap.exists() ? snap.data() : null;
}

export async function saveWeight(uid, dateKey, value, unit) {
  const { fsMod } = ctx;
  await fsMod.setDoc(weightDocRef(uid, dateKey), {
    value,
    unit,
    updatedAt: fsMod.serverTimestamp(),
  });
}

export async function fetchWeightInRange(uid, startKey, endKey) {
  const { fsMod, db } = ctx;
  const col = fsMod.collection(db, 'users', uid, 'weight');
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
