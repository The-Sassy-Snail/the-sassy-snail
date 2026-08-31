# Setup

This is a private, installable checklist + calendar app for your daily routine. It's a static site (no server) that syncs your data through a Firebase project **you** own — nothing goes through any third party besides Firebase/Google, and only you can read your data.

## 1. Create your Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and sign in with your Google account.
2. **Add project** → name it anything (e.g. `sassy-snail-routine`) → you can skip Google Analytics.
3. Once created, click the **web icon (`</>`)** on the project overview page to register a web app. Give it any nickname. You don't need Firebase Hosting.
4. Firebase will show you a `firebaseConfig` object that looks like:
   ```js
   {
     apiKey: "AIza...",
     authDomain: "sassy-snail-routine.firebaseapp.com",
     projectId: "sassy-snail-routine",
     storageBucket: "sassy-snail-routine.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   }
   ```
   Keep this tab open — you'll paste this into the app in step 5.

## 2. Turn on Firestore

1. In the left sidebar: **Build → Firestore Database → Create database**.
2. Choose **Production mode**, pick any region close to you.
3. Once it's created, go to the **Rules** tab and replace the contents with:

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
4. Click **Publish**. This means only a signed-in user can read or write their *own* data — nobody else's, and nothing is readable while signed out.

## 3. Turn on sign-in and create your one account

1. **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password**.
3. Go to the **Users** tab → **Add user** → enter your own email and a password. This app has no public sign-up screen on purpose (so no one else can create an account) — you make your one account here, once.

## 4. Enable GitHub Pages for this repo

1. On GitHub, go to the repo's **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Under **Custom domain**, enter `thesassysnail.com` (a `CNAME` file with this is already committed, so this should auto-fill) and save.
4. Check **Enforce HTTPS** once it's available (GitHub needs a few minutes to issue the certificate).
5. Make sure your domain registrar's DNS still points at GitHub Pages (this was presumably already set up since the domain was already connected to this repo) — an `A` record set to GitHub's Pages IPs, or a `CNAME`/`ALIAS` record to `<your-github-username>.github.io`, depending on how you had it configured before.

## 5. Open the app and connect it

1. Visit `https://thesassysnail.com` on your phone (or laptop first, to test).
2. On first load you'll see **"Connect your private space"** — paste the `firebaseConfig` object from step 1 exactly as shown (it's fine to paste the whole `{ ... }` block, including the `key: value` syntax — the app accepts real JS-object or JSON style) and tap **Save & continue**.
   - If it complains about formatting, just make sure each key is in double quotes, e.g. `{"apiKey": "AIza...", "projectId": "..."}`.
3. Sign in with the email/password you created in step 3.
4. You're in. This device is now remembered — you won't need to paste the config again on it. Repeat step 5 on any other device (phone, laptop) using the *same* Firebase config and the *same* login, and your check-offs will sync between them.

## 6. Install it on your phone

- **iPhone (Safari):** open the site → tap the **Share** icon → **Add to Home Screen**.
- **Android (Chrome):** open the site → tap the **⋮** menu → **Add to Home screen** / **Install app** (Chrome may also prompt you automatically).

It'll then open full-screen like a normal app, and keeps working offline (your check-offs sync back up next time you're online).

## Notes

- Your Firebase config is not a secret password — it's stored on each device's browser (`localStorage`), not committed to the repo. Real access control is enforced by the Firestore rules in step 2 plus your login.
- The old art-site content wasn't deleted, just moved to `/archive-old-site/` in this repo in case you want it back later.
- Everything about your routine (sections, items, stars, which days they show on) is editable from the **Settings** tab in the app itself — no code changes needed for day-to-day tweaks.
