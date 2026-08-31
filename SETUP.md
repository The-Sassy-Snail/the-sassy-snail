# Setup — step by step, no coding required

You'll do this once. It takes about 10-15 minutes. Every step is clicking buttons and filling in boxes — nothing here requires knowing how to code. If anything looks different from what's described (Google/GitHub redesign their screens sometimes), the button you want is usually still there, just moved — look for the closest-sounding label.

Two accounts are involved and it's easy to mix them up, so keep this straight:
- **GitHub** = where this website's files live, and where the site itself is hosted.
- **Firebase** (a Google product) = where your private checklist data (your check-offs, your history) is stored. You're about to create this one from scratch.

---

## Step 1 — Create your Firebase project

1. Go to **console.firebase.google.com** and sign in with any Google account (Gmail account) — this can be your personal one.
2. Click **Create a project** (sometimes labeled **Add project**).
3. Type any name you like, e.g. `my routine` — it's just a label for you, nobody else sees it. Click **Continue**.
4. It will ask about **Google Analytics** — turn the toggle **off** (you don't need it), then click **Create project**.
5. Wait for it to finish (~30 seconds), then click **Continue**. You'll land on a project dashboard.

## Step 2 — Register a "web app" inside that project

This step gets you a block of text (your "config") that lets the checklist app talk to your Firebase project.

1. On the project dashboard, look for a row of small icons near the top — one looks like `</>`. Click it. (It might be labeled "Web".)
2. Give the app a nickname, e.g. `routine app`. Leave the other checkboxes unchecked. Click **Register app**.
3. You'll now see a gray code box that starts with something like:
   ```
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "...",
     ...
   };
   ```
   **Leave this browser tab open** — you'll come back to copy this in Step 6. (If you accidentally close it: go to the gear icon ⚙️ next to "Project Overview" → **Project settings**, scroll down to "Your apps", and it's shown there again.)
4. Click **Continue to console**.

## Step 3 — Turn on the database (Firestore)

1. In the left-hand menu, find **Build**, and under it click **Firestore Database**.
2. Click **Create database**.
3. Choose **Production mode** (should be selected by default, or you'll see a toggle — pick "Production"). Click **Next**.
4. Pick any location close to you from the dropdown (the default is usually fine). Click **Enable**.
5. Once it loads, click the **Rules** tab (near the top of the Firestore page).
6. You'll see a box of text. **Select all of it and delete it**, then paste this in its place:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
7. Click **Publish**. (This is the part that makes your data private — it tells Firebase "only let someone in if they're logged in as the owner of this exact data.")

## Step 4 — Turn on sign-in, and create your one login

1. In the left-hand menu under **Build**, click **Authentication**.
2. Click **Get started**.
3. You'll see a list of sign-in methods. Click **Email/Password**.
4. Toggle the first switch (**Email/Password**) to **on**. Leave the second one (passwordless) off. Click **Save**.
5. Click the **Users** tab (near the top of the Authentication page).
6. Click **Add user**.
7. Type in an email address (can be your real one) and choose a password you'll remember — this becomes your login for the app. Click **Add user**.

That's the only account anyone can ever sign in with — there's no public "sign up" button on the app itself, on purpose.

## Step 5 — Turn on the website (GitHub Pages)

1. Go to this repository on **github.com** and click **Settings** (top right of the repo, not your account settings).
2. In the left-hand menu, click **Pages**.
3. Under "Build and deployment" → **Source**, choose **Deploy from a branch**.
4. Under **Branch**, pick `main` and `/ (root)`, then click **Save**.
5. Scroll to **Custom domain**, type `thesassysnail.com`, and click **Save**. (There's already a file in this repo that tells GitHub about this domain, so it should be quick.)
6. Wait a few minutes, then refresh the page — once it's ready, tick **Enforce HTTPS** if it appears as an option.
7. If your domain was already pointed at this GitHub Pages site before (you mentioned it was), you likely don't need to touch anything else. If the page shows a DNS warning, that means your domain registrar's settings need to point here — tell me and I'll walk you through exactly what to change there too.

## Step 6 — Connect the app to your Firebase project

1. Visit **thesassysnail.com** (give it a few minutes after Step 5 if it doesn't load right away).
2. You'll see **"Connect your private space"** with a big paste box.
3. Go back to the Firebase tab from Step 2, find that `const firebaseConfig = { ... };` box, and copy the **whole thing** — you can just select from `const` all the way to the closing `;`, copy, and paste it in as-is. You don't need to clean it up or remove anything.
4. Tap **Save & continue**.
5. Now sign in with the email and password you created in Step 4.

You're in. This device now remembers the connection — you won't see that paste screen again on it. To use it on another device (like a second phone or a laptop), open the site there and repeat Step 6 with the same config and same login; your checkmarks will stay in sync between devices.

## Step 7 — Put it on your home screen

- **iPhone:** open the site in Safari → tap the **Share** icon (square with an arrow) → **Add to Home Screen**.
- **Android:** open the site in Chrome → tap the **⋮** (three dots) → **Add to Home screen** (Chrome sometimes offers this automatically as a banner).

It'll now open full-screen like a normal app.

---

## Step 8 — Notifications (optional): a real reminder at set times

This makes your phone buzz at, say, 7am and 8pm, even if the app isn't open — like a normal app reminder. It needs two more one-time pieces set up: a "Web Push" key from Firebase, and a way to actually fire the reminder at the right time each day (this app uses this GitHub repo's free scheduled Actions for that, so no paid Firebase plan is needed).

**8a. Get the Web Push key**
1. In Firebase console, click the gear icon ⚙️ next to "Project Overview" → **Project settings**.
2. Click the **Cloud Messaging** tab.
3. Scroll to **"Web configuration"** → **"Web Push certificates"** → click **Generate key pair**.
4. Copy the long key string it shows you.

**8b. Get a service account key** (this lets the scheduled reminder job talk to your Firebase project — keep this file private, never share it or commit it anywhere)
1. Still in Project settings, click the **Service accounts** tab.
2. Click **Generate new private key** → confirm → a `.json` file downloads to your computer.
3. Open that file in a text editor and copy its entire contents.

**8c. Add it as a GitHub secret**
1. On GitHub, go to this repo → **Settings → Secrets and variables → Actions**.
2. Click **New repository secret**.
3. Name: `FIREBASE_SERVICE_ACCOUNT`. Value: paste the entire JSON file content from step 8b. Click **Add secret**.
4. You can now delete the downloaded `.json` file from your computer — it's safely stored as a secret.

**8d. Turn it on in the app**
1. Open the app → **Settings** tab → find **🔔 Notifications**.
2. Paste the Web Push key from step 8a into the box.
3. Set your preferred morning/evening times.
4. Tap **"Turn on for this device"** and allow notifications when your browser/phone asks.
5. Repeat this step (8d) on each additional device — the Web Push key carries over automatically, but each device needs its own permission grant.

**Notes:**
- **On iPhone**, this only works if the app is added to your Home Screen (Step 7) and opened from there, not from a regular Safari tab — that's an Apple restriction, not something in the app.
- Reminders can arrive a few minutes later than the exact time you set (GitHub's free scheduler checks every ~15 minutes, and can be a little slower during their busy periods) — fine for a routine reminder, not something to rely on for anything time-critical.
- If you go a couple of months without pushing any change to this repo, GitHub automatically pauses scheduled jobs. If reminders stop arriving after a long quiet stretch, ask me and I'll re-enable it (or just make any small commit).

---

## If something goes wrong

- **"That doesn't look like a valid Firebase config"** when pasting in Step 6 — make sure you copied starting from `const firebaseConfig = {` all the way through the final `};`, not just part of it.
- **Can't sign in** — double check the email/password from Step 4 (Firebase console → Authentication → Users). You can also tap "Forgot password?" on the sign-in screen to get a reset email.
- **Site doesn't load at all / wrong content** — GitHub Pages (Step 5) can take a few minutes after saving; also double-check your domain's DNS if it shows a warning there.
- Stuck on anything else — just tell me what you see on the screen and I'll figure out the next click with you.

## Notes

- Nothing you paste in Step 6 is a secret password — it's stored only in that device's browser, never sent anywhere but your own Firebase project. The actual privacy protection is the Rules from Step 3 plus your login.
- The old art-site content wasn't deleted — it's saved in this repo under `/archive-old-site/` in case you want any of it back.
- Once everything's connected, all future changes to your routine (adding/removing/renaming tasks, changing which days something shows up) happen right inside the app's **Settings** tab — no more setup needed after today.
