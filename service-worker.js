const CACHE_NAME = 'routine-shell-v7';

// Firebase Cloud Messaging needs to run inside the service worker so a push
// can show a notification even while the app/tab is closed. The Firebase
// config isn't a build-time constant here (it's whatever the user pasted
// in), so app.js appends it as a query string when registering this worker,
// and we read it back out here — the standard trick Firebase's own docs
// recommend for apps without a bundler-time config file.
(function initMessaging() {
  const fbConfigRaw = new URLSearchParams(self.location.search).get('fbConfig');
  if (!fbConfigRaw) return;
  try {
    const firebaseConfig = JSON.parse(fbConfigRaw);
    importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const title = (payload.notification && payload.notification.title) || 'Daily Routine';
      const options = {
        body: (payload.notification && payload.notification.body) || '',
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        data: payload.data || {},
      };
      self.registration.showNotification(title, options);
    });
  } catch (e) {
    console.warn('Messaging init failed in service worker', e);
  }
})();
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/data.js',
  './js/util.js',
  './js/store.js',
  './js/firebase.js',
  './js/views/today.js',
  './js/views/calendar.js',
  './js/views/settings.js',
  './js/views/tasks.js',
  './js/views/notes.js',
  './js/views/home.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let Firebase/Firestore requests pass through untouched

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
