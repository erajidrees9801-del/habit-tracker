<div align="center">

# 🔥 Streaks – Habit Tracker

**Build habits that stick. Track streaks, get reminders, and watch your progress grow.**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?logo=chartdotjs&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/license-free%20to%20use-10b981)

</div>

---

## 📑 Table of contents

1. [About the project](#-about-the-project)
2. [Screenshots](#-screenshots)
3. [Features](#-features)
4. [Tech stack and free services](#-tech-stack-and-free-services)
5. [How it works (architecture)](#-how-it-works-architecture)
6. [Project structure](#-project-structure)
7. [Getting started](#-getting-started)
8. [Firebase setup (step by step)](#-firebase-setup-step-by-step)
9. [Using the app](#-using-the-app)
10. [Streaks, weekly goals, XP and badges](#-streaks-weekly-goals-xp-and-badges)
11. [Reminders and alarms](#-reminders-and-alarms)
12. [Offline mode, sync and PWA](#-offline-mode-sync-and-pwa)
13. [Data model and storage keys](#-data-model-and-storage-keys)
14. [Customization](#-customization)
15. [Keyboard shortcuts](#-keyboard-shortcuts)
16. [Security and privacy](#-security-and-privacy)
17. [Deployment](#-deployment)
18. [Browser support](#-browser-support)
19. [Testing checklist](#-testing-checklist)
20. [Troubleshooting](#-troubleshooting)
21. [FAQ](#-faq)
22. [Known limitations](#-known-limitations)
23. [Roadmap](#-roadmap)
24. [Contributing](#-contributing)
25. [Changelog](#-changelog)
26. [Credits and license](#-credits-and-license)

---

## 📖 About the project

**Streaks** is a complete habit-tracking web app built with plain **HTML, CSS and JavaScript**. There is no framework and no build step: open the folder, run a small local server, and it works.

Users create an account, add habits with their own colors, repeat days, weekly goals and reminder times, then tick them off every day. The app calculates streaks, shows charts and a calendar, and rewards consistency with XP, levels and badges.

Data is stored in the cloud with **Firebase** (free plan), so habits follow the user across devices. The app is also a **Progressive Web App (PWA)**: it can be installed on a phone or computer, and it keeps working **without internet**. Changes made offline are saved on the device and synced automatically when the connection returns.

**Goals of the project**

- A professional, modern, responsive interface that works on every screen size
- Only free services, so anyone can run and host it at no cost
- Clean, readable code that a beginner can study and extend

> **Demo Mode:** until Firebase keys are added, the app runs entirely in the browser and saves data in `localStorage`. This is perfect for a quick try-out.

---

## 🖼 Screenshots

Add your own screenshots to a `screenshots/` folder and uncomment the lines below.

<!--
| Login | Today | Analytics |
|---|---|---|
| ![Login](screenshots/login.png) | ![Today](screenshots/today.png) | ![Analytics](screenshots/analytics.png) |

| Calendar | Rewards | Profile |
|---|---|---|
| ![Calendar](screenshots/calendar.png) | ![Rewards](screenshots/rewards.png) | ![Profile](screenshots/profile.png) |
-->

---

## ✨ Features

### 🔐 Accounts and login
- Sign up and log in with **email and password**
- A **loading spinner** appears on the button while the request is running
- Clear, friendly error messages (wrong password, email already registered, weak password, no internet)
- Show / hide password button
- Confirm-password field on sign up
- **Email verification** link and **password-reset** email (Profile → Account Security)
- Each user only ever sees their own data

### ✅ Habits
- Add, **edit** and delete habits (with an **Undo** option after deleting)
- Pick a **color** for every habit
- Choose which **days of the week** a habit repeats on (for example Monday to Friday)
- Set a **weekly goal** from 1 to 7 times per week, with a progress bar on the card
- Optional **reminder time** with an alarm
- One-tap daily check button with a pop animation
- **Streak counter** and a **7-day history strip** on every card
- Filters: **All**, **Pending**, **Completed**
- "Rest day" message when nothing is scheduled today

### 📊 Progress and insights
- **Today's progress ring** with an animated percentage
- Stat cards: best streak, completions this week, active habits
- **Calendar** month view, color-shaded by how many habits were completed each day; tap a day to see its habits and fix missed days
- **Analytics** page:
  - 7-day completion bar chart (Chart.js)
  - 5-week heatmap
  - 30-day success rate for every habit
  - Insights: your best weekday, habit with the longest current streak, total completions, best streak ever

### 🏆 Rewards (gamification)
- **XP and levels** (Seedling → Sprout → Builder → Achiever → Pro → Master → Legend)
- **9 badges**, such as First Step, On Fire, Week Warrior, Habit Master, Centurion, Perfect Day and Weekly Champion
- Confetti and a toast message when a badge unlocks, and when every habit of the day is done

### 👤 Profile and settings
- Display name
- **Profile picture** (JPG, PNG or WebP, up to 5 MB) with zoom and crop before saving, and a remove button
- Theme: **Auto**, **Light** or **Dark**
- Alarm sound on or off
- Browser notifications on or off
- **Backup:** export all habits to a JSON file and import them back
- Collapsible "Account Security" and "Settings" sections

### 🎨 Design and experience
- Fully **responsive**: sidebar on desktop, bottom navigation bar on phones
- Smooth animations: count-up numbers, animated ring, card entrance, view transitions, confetti, floating gradient background on the login page
- Respects the system **"reduce motion"** setting
- A motivational **quote** from a free API (with offline backup quotes)
- Keyboard shortcuts (see [below](#-keyboard-shortcuts))

### 📴 Offline and install
- **Installable** on Android, iOS (Add to Home Screen) and desktop
- **Works offline** after the first visit (service worker caches the app)
- **Offline-safe sync:** changes made without internet are never lost and upload automatically later

---

## 🧰 Tech stack and free services

| Layer | Technology | Cost |
|---|---|---|
| Structure | HTML5 | Free |
| Styling | CSS3 (custom properties, grid, flexbox, animations) | Free |
| Logic | Vanilla JavaScript (ES modules) | Free |
| Login | Firebase Authentication (Email/Password) | Free on the Spark plan |
| Database | Cloud Firestore | Free on the Spark plan |
| Charts | Chart.js 4 (from cdnjs) | Free |
| Fonts | Google Fonts, *Plus Jakarta Sans* | Free |
| Quotes | Quotable API (no key needed) | Free |
| Offline / install | Service Worker + Web App Manifest | Free |
| Hosting (optional) | GitHub Pages, Firebase Hosting or Netlify | Free |

---

## 🧠 How it works (architecture)

```
┌──────────────────────────── Browser ────────────────────────────┐
│                                                                 │
│  index.html ──► style.css                                       │
│       │                                                         │
│       └──► app.js  (ES module)                                  │
│              │                                                  │
│              ├─ UI layer: render(), setView(), modals, toasts   │
│              ├─ Logic: streaks, weekly goals, XP, badges        │
│              ├─ Alarm timer (checks every 5 seconds)            │
│              └─ Storage "backend" (one of two):                 │
│                    ├─ demo      → localStorage only             │
│                    └─ firebase  → localStorage + Firestore      │
│                                                                 │
│  sw.js (service worker) ──► caches app files for offline use    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              Firebase Authentication + Cloud Firestore
```

**Two interchangeable backends.** `app.js` has a `demo` backend and a `firebaseBackend()`. Both expose the same methods (`init`, `signup`, `login`, `logout`, `load`, `save`), so the rest of the app does not care which one is active. The app picks Demo Mode automatically when `apiKey` still starts with `YOUR`.

**Local-first saving.** Every change is written to `localStorage` first and only then sent to Firestore. This is what makes offline mode safe.

---

## 📁 Project structure

```
habit-tracker/
├── index.html         Page structure: login, dashboard, all views and modals
├── style.css          All styles: themes, layout, animations, responsive rules
├── app.js             Application logic (see sections below)
├── sw.js              Service worker for offline caching
├── manifest.json      PWA settings: name, colors, icons
├── streaks-icon.png   App icon, 512 x 512
├── icon-192.png       App icon, 192 x 192
└── README.md          This file
```

> If your script file is named `app.js`, rename it to `app.js`, and update the `<script type="module" ...>` tag in `index.html` and the `APP_FILES` list in `sw.js`. File names with spaces and brackets can cause problems on some servers.

### Inside `app.js`

| Section | What it does |
|---|---|
| Config | Firebase keys and Demo Mode switch |
| Backends | `demo` backend and `firebaseBackend()` with offline-safe `load` and `save` |
| Auth UI | Login / sign up form, validation, error messages, spinner |
| Icons | Small inline SVG icon set |
| Settings, theme, effects | Theme, number count-up animation, confetti |
| Schedule helpers | `dueOn()` decides whether a habit is scheduled on a given day |
| Badges and XP | Streak calculation, badge rules, level and XP |
| Calendar | Month grid and the "fix a past day" list |
| Profile / Profile picture | Name, photo upload with zoom and crop |
| Account Security | Verification email and password reset |
| Insights and backup | Analytics tiles, JSON export and import |
| Habits | Add / edit / delete form, rendering cards, filters, views |
| Alarm | Timer, beep, pop-up, snooze |
| Browser notifications | Permission handling and the Enable / Disable button |
| Quote | Quote API with offline fallback |
| Boot | Starts the correct backend and listens for login state |

---

## 🚀 Getting started

### Requirements
- A modern browser (Chrome, Edge, Firefox or Safari)
- A code editor such as **VS Code**
- A free Google account (only needed for Firebase)

### 1. Get the files
Download or clone the project into a folder named `habit-tracker`.

```bash
git clone https://github.com/<your-username>/habit-tracker.git
cd habit-tracker
```

### 2. Run a local server
ES modules and service workers do **not** work when you double-click `index.html`. Use one of these:

**VS Code Live Server (easiest)**
1. Install the **Live Server** extension.
2. Right-click `index.html` → **Open with Live Server**.

**Python**
```bash
python -m http.server 8000
```
Open `http://localhost:8000`.

**Node**
```bash
npx serve .
```

### 3. Try Demo Mode
Without any setup the app starts in Demo Mode. Create an account (it is stored only in your browser), add a habit, and explore every screen.

### 4. Connect Firebase (optional but recommended)
Follow the next section to enable real accounts and cloud sync.

---

## 🔥 Firebase setup (step by step)

### Step 1: Create a project
1. Open <https://console.firebase.google.com> and sign in.
2. Click **Add project**, enter a name (for example `streaks`), turn Google Analytics off, and click **Create project**.

### Step 2: Turn on login
1. In the left menu open **Build → Authentication**.
2. Click **Get started**.
3. Choose **Email/Password**, switch **Enable** on, and click **Save**.

### Step 3: Create the database
1. Open **Build → Firestore Database** → **Create database**.
2. Choose **Standard** edition, any location, and **Start in production mode**.
3. Click **Create** and wait a few seconds.

### Step 4: Set security rules
Open the **Rules** tab, replace everything with the rules below, and click **Publish**.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

These rules mean: *a signed-in user can read and write only the document that belongs to them.* Do not skip this step; without it the app cannot save data.

### Step 5: Register the web app and copy the keys
1. Click the **gear icon → Project settings**.
2. Under **Your app** click the **`</>` (Web)** icon.
3. Enter a nickname (for example `streaks-web`). Leave **Firebase Hosting** unchecked. Click **Register app**.
4. You will see a `firebaseConfig` block. Copy the values.

### Step 6: Paste the keys into `app.js`
Open `app.js`. The configuration is at the very top:

```js
const FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  appId: "1:1234567890:web:abcdef123456"
};
```

Keep the quotes and commas. The `appId` must be the long value that starts with `1:` and contains `:web:`.

### Step 7: Test it
1. Hard-refresh the page (**Ctrl + Shift + R**). The "Demo mode" note disappears.
2. Sign up with a new email and a password of at least 6 characters.
3. Add a habit and refresh. It should still be there.
4. In Firebase, check **Authentication → Users** (your email) and **Firestore → Data → users** (your habits).

---

## 🧭 Using the app

| Screen | What you can do |
|---|---|
| **Login** | Switch between *Log in* and *Sign up*. A spinner shows while the request runs. |
| **Today** | See the progress ring and stats, filter habits, tick habits off, edit or delete them. |
| **Calendar** | Browse months, see how each day went, tap a day to view or correct it. Future days cannot be edited. |
| **Analytics** | 7-day chart, 5-week heatmap, 30-day success rate and insights. |
| **Rewards** | Your level, XP bar and all badges (locked ones show progress). |
| **Profile** | Name, photo, account security and settings (theme, sound, notifications, backup, log out). |

### Adding a habit
1. Press **New habit** (or press **N**).
2. Type a name (up to 40 characters).
3. Pick a color.
4. Tap the days it repeats on. All days are selected by default.
5. Choose a weekly goal.
6. Optionally set a reminder time.
7. Press **Save habit**.

### Editing and deleting
- Tap the **pencil** on a card to edit it.
- Tap the **trash** icon to delete it. An **Undo** button appears for 5 seconds.

### Fixing a missed day
Open **Calendar**, tap the day, then tap the habit to mark it done or not done.

### Backing up your data
Profile → Settings → **Export** downloads a `.json` file. **Import** adds habits from such a file (habits that already exist are skipped).

---

## 🎯 Streaks, weekly goals, XP and badges

### Streaks
- A streak counts **consecutive scheduled days** on which the habit was done.
- Days a habit is **not scheduled** do not break the streak. A "Monday to Friday" habit keeps its streak over the weekend.
- If today is scheduled but not done yet, the streak is not broken until the day ends.

### Weekly goal
- The week runs from **Monday to Sunday**.
- Each card shows progress such as `2/3 this week` with a bar, and a trophy message when the goal is reached.

### XP and levels
```
XP    = (total completions × 10) + (unlocked badges × 50)
Level = floor(XP / 100) + 1
```

| Level | Title |
|---|---|
| 1 | Seedling |
| 2 | Sprout |
| 3 | Builder |
| 4 | Achiever |
| 5 | Pro |
| 6 | Master |
| 7 and above | Legend |

### Badges

| Badge | How to unlock |
|---|---|
| 🌱 First Step | Complete any habit once |
| 🔥 On Fire | 3-day streak |
| ⚡ Week Warrior | 7-day streak |
| 👑 Habit Master | 30-day streak |
| 🎯 Getting Serious | 25 completions |
| 💎 Centurion | 100 completions |
| 🧩 Collector | Track 5 habits |
| 🌟 Perfect Day | Finish every scheduled habit in one day |
| 🏆 Weekly Champion | Reach a habit's weekly goal |

Unlocked badges are remembered, even if you later delete habits.

---

## ⏰ Reminders and alarms

- Every 5 seconds the app checks whether the current time (`HH:MM`) matches the reminder time of a habit that is **scheduled today** and **not yet done**.
- When it matches, a pop-up opens, a beep plays (repeating every 4 seconds until you act), and a **browser notification** is shown if permitted.
- Pop-up buttons: **Mark done**, **Snooze 5 min**, **Dismiss**.
- Alarm sound can be switched off in Settings.

**Important:** a normal website can only ring while the page (or installed app) is **open**. Keep the tab open or the installed app running at the reminder time. For alarms while the app is fully closed, push notifications with a server would be needed (see the [Roadmap](#-roadmap)).

To enable notifications, press **Enable** under *Profile → Settings → Browser notifications* and click **Allow** in the browser prompt. If the browser shows "Blocked", re-allow notifications for the site in the browser's site settings.

---

## 📴 Offline mode, sync and PWA

### Local-first saving
`ht_data_<id>` holds a copy of the habits in the browser. `ht_dirty_<id>` set to `true` means "saved here, not yet uploaded".

1. On every change the habits are saved to `localStorage` and the dirty flag is set.
2. If the internet works, the data is uploaded to Firestore (8-second timeout) and the flag is removed.
3. If you are offline, the flag stays. When the browser fires the `online` event, or on the next start, the data is uploaded automatically.
4. On start, if the dirty flag is set, **local data wins** and is uploaded. It is never overwritten by older cloud data.

### Service worker (`sw.js`)
- On install it caches the app shell (`index.html`, `style.css`, `app.js`, `manifest.json`).
- For every request it tries the **network first** and saves a fresh copy; if the network fails it serves the **cached** copy. This keeps the app up to date while still working offline.
- **After you change any file**, bump `CACHE_NAME` in `sw.js` (for example `streaks-shell-v3`) so users receive the new version.

### Install as an app
- **Android (Chrome):** menu → **Install app** / **Add to Home screen**
- **Desktop (Chrome / Edge):** click the install icon in the address bar
- **iPhone (Safari):** Share → **Add to Home Screen**

PWAs need **HTTPS** (or `localhost`). GitHub Pages and Firebase Hosting both provide HTTPS.

---

## 🗄 Data model and storage keys

### Firestore
One document per user: `users/{uid}`

```json
{
  "habits": [
    {
      "id": "lq3x9a",
      "name": "Drink water",
      "color": "#10b981",
      "time": "09:00",
      "days": [1, 2, 3, 4, 5],
      "weeklyTarget": 3,
      "log": {
        "2026-10-16": true,
        "2026-10-17": true
      }
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `id` | Unique id generated when the habit is created |
| `name` | Habit name (max 40 characters) |
| `color` | Hex color used on the card |
| `time` | Reminder time `HH:MM`, or empty |
| `days` | Optional list of weekdays (0 = Sunday … 6 = Saturday). Missing means every day |
| `weeklyTarget` | Goal per week (1 to 7). Defaults to 3 |
| `log` | Map of dates (`YYYY-MM-DD`) on which the habit was completed |

### Browser storage keys

| Key | Purpose |
|---|---|
| `ht_data_<id>` | Local copy of the user's habits |
| `ht_dirty_<id>` | `true` when local changes have not reached Firebase yet |
| `ht_badges_<id>` | Unlocked badge ids |
| `ht_photo_<id>` | Profile picture (saved on this device) |
| `ht_settings` | Theme, alarm sound and display names |
| `browserNotificationsEnabled` | Whether the user switched notifications on |
| `ht_users`, `ht_session` | Demo Mode accounts and session only |

---

## 🎛 Customization

### Colors and theme
All colors are CSS variables at the top of `style.css`:

```css
:root{
  --bg:#f5f7fb;      /* page background */
  --card:#fff;       /* cards */
  --ink:#0f172a;     /* main text */
  --p:#4f46e5;       /* primary color */
  --p2:#7c3aed;      /* second color used in gradients */
  --ok:#10b981;      /* success green */
  --alarm:#ef4444;   /* alarm red */
}
```
Dark mode values are defined in `:root[data-theme=dark]` and in the `prefers-color-scheme: dark` block.

### Habit colors
Edit the `COLORS` array in `app.js`:
```js
const COLORS=['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899'];
```

### Badges
Add an object to the `BADGES` array. The function `p` returns `[current, target]`:
```js
{id:'t500', e:'🚀', n:'Unstoppable', d:'500 completions', p:s=>[s.total,500]}
```

### Quotes
Add your own lines to the `QUOTES` array (used when the quote API is not reachable).

### App name, icons and install color
Edit `manifest.json` (`name`, `short_name`, `theme_color`, `background_color`, `icons`) and replace `streaks-icon.png` (512 × 512) and `icon-192.png` (192 × 192).

---

## ⌨ Keyboard shortcuts

| Key | Action |
|---|---|
| **N** | Open the "New habit" window (when you are not typing in a field) |
| **Esc** | Close the add / edit window |

---

## 🔒 Security and privacy

- **Firestore rules** make sure users can only access their own document. Keep the rules from [Step 4](#step-4-set-security-rules).
- The Firebase web `apiKey` is **not a secret**; it only identifies your project. Security comes from the rules and from Authentication. Do not put admin keys or service-account files in the project.
- Passwords are handled entirely by Firebase Authentication; the app never stores them.
- User-entered text (habit names) is inserted with `textContent`, which prevents HTML injection.
- **Demo Mode** stores a simple encoded password in the browser and is for testing only. Do not use real passwords there.
- Profile pictures and display names are stored only on the user's device.

---

## 🌍 Deployment

### GitHub Pages (free)
1. Upload the project to a GitHub repository.
2. **Settings → Pages** → choose branch `main` and folder `/ (root)` → **Save**.
3. Open the HTTPS link GitHub shows (it can take a minute).

### Firebase Hosting (free)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting     # public directory: .   (single-page app: No)
firebase deploy
```

### Netlify (free)
Drag and drop the project folder onto <https://app.netlify.com/drop>.

> Email/password login works on any domain. If you later add Google or other pop-up sign-in methods, add your domain in **Authentication → Settings → Authorized domains**.

---

## 🌐 Browser support

| Browser | Support |
|---|---|
| Chrome / Edge (desktop and Android) | Full, including install and notifications |
| Firefox | Full (install prompt is limited on desktop) |
| Safari (macOS / iOS) | Works; notifications and install have limits on iOS |

The animated progress ring uses CSS `@property`, available in current versions of all major browsers.

---

## ✅ Testing checklist

- [ ] Sign up with a new email, then log out and log back in
- [ ] Wrong password shows an error and the spinner stops
- [ ] Add a habit, refresh, the habit is still there
- [ ] Edit a habit (name, days, weekly goal) and delete it, then press **Undo**
- [ ] Set a reminder one minute ahead, the alarm rings, **Snooze** and **Mark done** work
- [ ] Switch theme between Auto, Light and Dark
- [ ] Open Calendar, change a past day, and check that Analytics updates
- [ ] Turn internet off, add or delete habits, refresh, then turn internet on and confirm they appear in Firestore
- [ ] Resize the browser from desktop to phone width
- [ ] Install the app and open it offline
- [ ] Export a backup, delete a habit, import the backup

---

## 🛠 Troubleshooting

| Problem | Solution |
|---|---|
| Blank page, or buttons do nothing | Use Live Server (not double-click). Press **F12** → **Console** and read the red error. A single typo in `app.js` stops the whole script. |
| "Demo mode" note is still visible | Firebase keys are missing in `app.js`, or the page was not hard-refreshed (**Ctrl + Shift + R**). |
| `auth/operation-not-allowed` | Email/Password is not enabled in Firebase Authentication. |
| `auth/invalid-credential` | Wrong email or password. |
| "Could not load your habits. Check Firestore rules." | The Firestore database is not created, or the rules from Step 4 are not published. |
| Offline changes disappear | Make sure you are using the latest `app.js` with the dirty-flag sync, and that the app was opened online at least once. |
| Old design still shows after an update | The service worker is serving cached files. Bump `CACHE_NAME` in `sw.js`, or open DevTools → Application → Service Workers → **Unregister**, then hard refresh. |
| App cannot be installed | Needs HTTPS or localhost, a valid `manifest.json`, and the icon files must exist. |
| Alarm does not ring | Allow notifications, keep the page open, and check that *Alarm sound* is on. Browsers may block sound until you have clicked on the page once. |
| Quote never changes | The quote API is unreachable; the app shows a built-in quote instead. This is normal. |
| Profile picture will not upload | Use JPG, PNG or WebP smaller than 5 MB. |

---

## ❓ FAQ

**Do I need to know Firebase to use this?**
No. Follow the step-by-step section, or just use Demo Mode.

**Is it really free?**
Yes. Firebase's Spark plan and every other service used here are free for a project of this size.

**Can I use it on my phone?**
Yes. It is responsive and can be installed like an app.

**Will I lose my habits if I clear my browser data?**
With Firebase connected, habits are safe in the cloud. In Demo Mode they live only in the browser, so use **Export** to make a backup.

**Why did my alarm not ring when the app was closed?**
Websites cannot run timers when closed. The tab or installed app must be open.

**Can two devices use the same account?**
Yes. Habits sync through Firestore. If you change data on two devices while both are offline, the device that syncs last wins.

---

## ⚠ Known limitations

- Alarms only ring while the page or installed app is open.
- The first visit needs internet (to load Firebase, fonts and Chart.js).
- The profile picture and display name are stored on the device, not in the cloud.
- The whole habit list is stored in one Firestore document, which is fine for personal use but not for thousands of habits.
- Simultaneous offline edits on two devices are resolved by "last sync wins".

---

## 🗺 Roadmap

- [ ] Daily mood tracker and notes on each habit
- [ ] Choice of alarm tones
- [ ] Real push notifications (Firebase Cloud Messaging)
- [ ] Habit categories and search
- [ ] Share streaks with friends
- [ ] Google sign-in
- [ ] Cloud-synced profile picture (Firebase Storage)
- [ ] Multiple languages (including Urdu)

---

## 🤝 Contributing

Suggestions and improvements are welcome.

1. Fork the repository.
2. Create a branch: `git checkout -b feature/my-idea`
3. Commit your changes: `git commit -m "Add my idea"`
4. Push the branch and open a Pull Request.

Please keep the project dependency-free (plain HTML, CSS, JS) and test on a phone-sized screen.

---

## 📝 Changelog

| Version | Highlights |
|---|---|
| **1.0** | Login and sign up with loading spinner, habits, reminder alarms |
| **1.1** | Dashboard redesign: sidebar, stats, color-coded habit cards, animations |
| **1.2** | Calendar, analytics, rewards (XP, levels, badges), dark mode, profile |
| **1.3** | Edit habits, repeat days, insights, backup / import, undo delete, shortcuts |
| **1.4** | Weekly goals, profile picture, account security, collapsible settings |
| **1.5** | Offline-safe sync, installable PWA with service worker |

---

## 🙏 Credits and license

- [Firebase](https://firebase.google.com) for authentication and database
- [Chart.js](https://www.chartjs.org) for the charts
- [Google Fonts](https://fonts.google.com) for *Plus Jakarta Sans*
- [Quotable](https://github.com/lukePeavey/quotable) for the quotes API
- Icons are simple inline SVGs in the Feather style

This project is free to use for learning and personal projects. Replace this section with a formal license (for example MIT) if you publish it.

<div align="center">

Made with ❤️ to help build better habits, one day at a time.

</div>
