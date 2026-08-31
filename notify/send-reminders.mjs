// Run on a schedule by .github/workflows/reminders.yml (every ~15 minutes).
// Checks every user's notification settings, and if the current local time
// (in their own timezone) is close to a configured reminder time and hasn't
// already fired, sends a push notification via Firebase Cloud Messaging to
// every device they've enabled notifications on. Handles two kinds of
// reminders: fixed morning/evening times (once each per day), and an hourly
// water reminder fired once per hour within a configured window (e.g.
// 6am-9pm), deduped per calendar hour rather than per day. This script has
// full admin access to Firestore (via a service account secret) and
// bypasses the app's normal per-user security rules — it never runs in the
// browser.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const WINDOW_MINUTES = 8; // half the ~15min schedule interval, so no run is missed or doubled
const DEFAULT_TIMEZONE = 'Europe/Brussels';

const SLOTS = [
  {
    key: 'morning',
    timeField: 'morningTime',
    sentField: 'sentMorningDate',
    title: 'Good morning ☀️',
    body: "Time to start your morning routine — let's go!",
  },
  {
    key: 'evening',
    timeField: 'eveningTime',
    sentField: 'sentEveningDate',
    title: 'Evening routine 🌙',
    body: "Don't forget tonight's checklist.",
  },
];

function localParts(timezone) {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); // YYYY-MM-DD
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now); // HH:MM
  return { dateStr, timeStr };
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

async function main() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  const serviceAccount = JSON.parse(raw);

  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();

  // meta/{template,notify} docs live under users/{uid}/meta/*, so a
  // collection-group query on "meta" finds every user's notify doc without
  // needing to list the (otherwise-empty-looking) top-level users collection.
  const snap = await db.collectionGroup('meta').get();
  const notifyDocs = snap.docs.filter((d) => d.id === 'notify');

  console.log(`Checking ${notifyDocs.length} user(s) with notification settings...`);

  for (const docSnap of notifyDocs) {
    const data = docSnap.data();
    const tokens = Array.isArray(data.tokens) ? data.tokens : [];
    if (tokens.length === 0) continue;

    const uid = docSnap.ref.parent.parent.id;
    const timezone = data.timezone || DEFAULT_TIMEZONE;
    const { dateStr, timeStr } = localParts(timezone);
    const nowMin = toMinutes(timeStr);

    if (data.enabled) {
      for (const slot of SLOTS) {
        const target = data[slot.timeField];
        if (!target) continue;
        if (data[slot.sentField] === dateStr) continue; // already sent today
        if (Math.abs(nowMin - toMinutes(target)) > WINDOW_MINUTES) continue;

        await send(docSnap, uid, tokens, slot.title, slot.body, { [slot.sentField]: dateStr }, slot.key);
      }
    }

    if (data.waterEnabled) {
      const startHour = Number.isInteger(data.waterStartHour) ? data.waterStartHour : 6;
      const endHour = Number.isInteger(data.waterEndHour) ? data.waterEndHour : 21;
      const currentHour = Math.floor(nowMin / 60);
      const hourKey = `${dateStr}T${String(currentHour).padStart(2, '0')}`;

      if (
        currentHour >= startHour &&
        currentHour <= endHour &&
        data.sentWaterHour !== hourKey &&
        Math.abs(nowMin - currentHour * 60) <= WINDOW_MINUTES
      ) {
        await send(
          docSnap,
          uid,
          tokens,
          '💧 Water time',
          'Time for a glass of water — tap to log it.',
          { sentWaterHour: hourKey },
          'water'
        );
      }
    }
  }
}

async function send(docSnap, uid, tokens, title, body, sentUpdate, label) {
  const messaging = getMessaging();
  console.log(`Sending ${label} reminder to uid=${uid} (${tokens.length} device(s))`);

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    webpush: { fcmOptions: { link: 'https://thesassysnail.com/' } },
  });

  const staleTokens = [];
  response.responses.forEach((r, i) => {
    if (
      !r.success &&
      ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error?.code)
    ) {
      staleTokens.push(tokens[i]);
    }
  });

  const update = { ...sentUpdate };
  if (staleTokens.length) update.tokens = FieldValue.arrayRemove(...staleTokens);
  await docSnap.ref.update(update);

  console.log(
    `  -> ${response.successCount} sent, ${response.failureCount} failed` +
      (staleTokens.length ? `, removed ${staleTokens.length} stale token(s)` : '')
  );
}

main()
  .then(() => console.log('Done.'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
