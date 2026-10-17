/* ===== CONFIG: paste your Firebase keys here (see README). Leave as is for Demo Mode. ===== */
const FIREBASE_CONFIG = { apiKey: "AIzaSyByhw2mS88UXzXp8UXvHWk7UoK0xtDA7D4", authDomain: "habit-tracker-f89aa.firebaseapp.com", projectId: "habit-tracker-f89aa", appId: "habit-tracker-f89aa.firebaseapp.com" };
const DEMO = FIREBASE_CONFIG.apiKey.startsWith("YOUR");
const $ = s => document.querySelector(s);
const wait = ms => new Promise(r => setTimeout(r, ms));
const key = (d = new Date()) => d.toLocaleDateString('en-CA');
let db, user, habits = [], mode = 'login';
const rang = {}, snoozed = {};

/* ---------- Backends ---------- */
const demo = {
  init(cb) { demo.cb = cb; const e = localStorage.ht_session; cb(e ? { id: e, email: e } : null); },
  async signup(e, p) {
    await wait(900); const u = JSON.parse(localStorage.ht_users || '{}');
    if (u[e]) throw { code: 'auth/email-already-in-use' }; u[e] = btoa(p); localStorage.ht_users = JSON.stringify(u); demo.set(e);
  },
  async login(e, p) {
    await wait(900); const u = JSON.parse(localStorage.ht_users || '{}');
    if (u[e] !== btoa(p)) throw { code: 'auth/invalid-credential' }; demo.set(e);
  },
  set(e) { localStorage.ht_session = e; demo.cb({ id: e, email: e }); },
  async logout() { localStorage.removeItem('ht_session'); demo.cb(null); },
  async load(id) { return JSON.parse(localStorage['ht_data_' + id] || '[]'); },
  async save(id, h) { localStorage['ht_data_' + id] = JSON.stringify(h); }
};

async function firebaseBackend() {
  const b = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const [{ initializeApp }, A, F] = await Promise.all([import(b + 'firebase-app.js'), import(b + 'firebase-auth.js'), import(b + 'firebase-firestore.js')]);
  const app = initializeApp(FIREBASE_CONFIG), auth = A.getAuth(app), fs = F.getFirestore(app);

  /* ---- Offline-safe sync helpers ----
     ht_data_<id>  = habits copy saved in this browser (always updated first)
     ht_dirty_<id> = "true" means: changes are saved here but NOT yet sent to Firebase */
  const lk = id => 'ht_data_' + id;
  const dk = id => 'ht_dirty_' + id;
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  let seq = 0; // counts saves, so a newer save is never marked "synced" by an older one

  async function sync(id) {
    if (localStorage.getItem(dk(id)) !== 'true' || !navigator.onLine) return false;
    const mine = seq;
    const data = JSON.parse(localStorage.getItem(lk(id)) || '[]');
    try {
      await withTimeout(F.setDoc(F.doc(fs, 'users', id), { habits: data }), 8000);
      if (mine === seq) localStorage.removeItem(dk(id)); // only if nothing newer was saved meanwhile
      return true;
    } catch (e) {
      console.warn('Cloud sync pending; will retry.', e);
      return false;
    }
  }

  // When internet comes back, send the offline changes automatically (no refresh needed)
  addEventListener('online', async () => {
    const u = auth.currentUser;
    if (u && localStorage.getItem(dk(u.uid)) === 'true') {
      if (await sync(u.uid)) toast('Offline changes synced to cloud');
    }
  });

  return {
    init: cb => A.onAuthStateChanged(auth, u => cb(u && { id: u.uid, email: u.email })),
    signup: (e, p) => A.createUserWithEmailAndPassword(auth, e, p),
    login: (e, p) => A.signInWithEmailAndPassword(auth, e, p),
    logout: () => A.signOut(auth),
    resetPassword: (email) => A.sendPasswordResetEmail(auth, email),
    changePassword: (password) => A.updatePassword(auth.currentUser, password),
    changeEmail: (email) => A.verifyBeforeUpdateEmail(auth.currentUser, email),
    sendVerification: () => A.sendEmailVerification(auth.currentUser),

    async load(id) {
      const local = JSON.parse(localStorage.getItem(lk(id)) || '[]');

      // Offline changes are waiting: they win. Never overwrite them with old cloud data.
      if (localStorage.getItem(dk(id)) === 'true') {
        await sync(id);
        return local;
      }

      try {
        const s = await withTimeout(F.getDoc(F.doc(fs, 'users', id)), 8000);
        if (s.exists()) {
          const cloud = s.data().habits || [];
          localStorage.setItem(lk(id), JSON.stringify(cloud));
          return cloud;
        }
        return local;
      } catch (e) {
        console.warn('Firebase unavailable; using local habits.', e);
        return local;
      }
    },

    async save(id, h) {
      localStorage.setItem(lk(id), JSON.stringify(h));
      localStorage.setItem(dk(id), 'true'); // FIX: flag is set BEFORE any offline check, so offline changes are never lost
      seq++;
      await sync(id);
    }
  };
}

/* ---------- Auth UI ---------- */
const ERR = {
  'auth/invalid-credential': 'Wrong email or password.', 'auth/user-not-found': 'No account with this email.',
  'auth/wrong-password': 'Wrong email or password.', 'auth/email-already-in-use': 'This email is already registered. Try logging in.',
  'auth/weak-password': 'Password must be at least 6 characters.', 'auth/invalid-email': 'Enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.', 'auth/network-request-failed': 'No internet connection.'
};
function setMode(m) {
  mode = m;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.mode === m));
  $('#confirmWrap').hidden = m !== 'signup';
  $('#authTitle').textContent = m === 'login' ? 'Welcome back' : 'Create your account';
  $('#authSub').textContent = m === 'login' ? 'Log in to continue your streak.' : 'Start building better habits today.';
  $('#authBtn .label').textContent = m === 'login' ? 'Log in' : 'Create account';
  $('#password').autocomplete = m === 'login' ? 'current-password' : 'new-password';
  $('#authError').textContent = '';
}
document.querySelectorAll('.tab').forEach(t => t.onclick = () => setMode(t.dataset.mode));
$('#authForm').onsubmit = async ev => {
  ev.preventDefault();
  const email = $('#email').value.trim(), pw = $('#password').value, err = $('#authError'), btn = $('#authBtn');
  if (!db) {
    err.textContent = 'App is still loading. Please wait a moment and try again.';
    return;
  }
  err.textContent = '';
  if (!/^\S+@\S+\.\S+$/.test(email)) return err.textContent = 'Enter a valid email address.';
  if (pw.length < 6) return err.textContent = 'Password must be at least 6 characters.';
  if (mode === 'signup' && pw !== $('#confirm').value) return err.textContent = 'Passwords do not match.';
  btn.classList.add('loading');
  try { await (mode === 'login' ? db.login(email, pw) : db.signup(email, pw)); }
  catch (e) {
    console.error('Auth error:', e.code, e.message);
    err.textContent = `${e.code || 'Error'}: ${ERR[e.code] || e.message || 'Something went wrong.'}`;
  }
  btn.classList.remove('loading');
};
$('#logoutBtn').onclick = () => db.logout();

/* ---------- Icons ---------- */
const IC = { flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.4 1-3 0 1.4 1 2.5 2.5 2.5z"/>', mail: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/>', lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', plus: '<path d="M12 5v14M5 12h14"/>', today: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>', logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><path d="M21 12H9"/>', bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>', trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', check: '<polyline points="20 6 9 17 4 12"/>', x: '<path d="M18 6L6 18M6 6l12 12"/>', calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5L17 22l-5-3-5 3 1.5-8.5"/>', user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>' };
const ic = n => `<svg class="i" viewBox="0 0 24 24">${IC[n]}</svg>`;
const paint = (root = document) => root.querySelectorAll('[data-ic]').forEach(e => { e.innerHTML = ic(e.dataset.ic); e.removeAttribute('data-ic') });
function toast(m, a) { const t = $('#toast'); t.textContent = m; t.classList.toggle('act', !!a); if (a) { const b = document.createElement('button'); b.textContent = a.l; b.onclick = () => { a.f(); t.classList.remove('show') }; t.append(b) } t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), a ? 5000 : 2200) }
$('#eye').onclick = () => { const p = $('#password'); p.type = p.type === 'password' ? 'text' : 'password' };

/* ---------- Settings, theme, effects ---------- */
const S = Object.assign({ theme: 'auto', sound: true, names: {} }, JSON.parse(localStorage.ht_settings || '{}'));
const saveS = () => localStorage.ht_settings = JSON.stringify(S);
function applyTheme() { S.theme === 'auto' ? document.documentElement.removeAttribute('data-theme') : document.documentElement.dataset.theme = S.theme }
applyTheme();
const nm = () => S.names[user.id] || user.email.split('@')[0];
function titles() { const hr = new Date().getHours(); $('#greeting').textContent = view === 'today' ? (hr < 5 ? 'Good night' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening') + ', ' + nm() : { cal: 'Calendar', stats: 'Analytics', rewards: 'Rewards', profile: 'Profile' }[view] }
function ident() { const n = nm(); $('#meName').textContent = n; $('#meMail').textContent = user.email; $('#avatar').textContent = $('#pAvatar').textContent = n[0].toUpperCase(); titles() }
const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
function num(el, to, suf = '') { const from = el._v || 0; el._v = to; if (from === to || reduced()) { el.textContent = to + suf; return } const t0 = performance.now(); (function f(t) { const p = Math.min(1, (t - t0) / 600); el.textContent = Math.round(from + (to - from) * p) + suf; if (p < 1) requestAnimationFrame(f) })(t0) }
function confetti(n = 140) {
  if (reduced()) return; const c = $('#confetti'), x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = ['#9e58d3', '#10b981', '#6a5f4c', '#ef4444', '#06b6d4', '#ec4899'];
  const P = Array.from({ length: n }, () => ({ x: innerWidth / 2, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: Math.random() * -14 - 4, s: Math.random() * 8 + 4, c: cols[Math.random() * 6 | 0], r: Math.random() * 6, vr: (Math.random() - .5) * .4 }));
  let f = 0; (function t() { x.clearRect(0, 0, c.width, c.height); P.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore() }); if (++f < 150) requestAnimationFrame(t); else x.clearRect(0, 0, c.width, c.height) })()
}

/* ---------- Schedule helpers ---------- */
const dueOn = (h, d) => !h.days || h.days.includes(d.getDay());
const dd = k => new Date(k + 'T00:00');

/* ---------- Badges & XP ---------- */
function bestEver(h) { const ks = Object.keys(h.log).sort(); if (!ks.length) return 0; let b = 0, c = 0; const d = dd(ks[0]), end = new Date(); while (d <= end) { if (dueOn(h, d)) { if (h.log[key(d)]) { c++; b = Math.max(b, c) } else if (key(d) !== key(end)) c = 0 } d.setDate(d.getDate() + 1) } return b }
function gs() {
  const dates = new Set(); habits.forEach(h => Object.keys(h.log).forEach(d => dates.add(d)));
  return {
    total: habits.reduce((s, h) => s + Object.keys(h.log).length, 0), best: Math.max(0, ...habits.map(bestEver)), count: habits.length, perfect: [...dates].filter(d => { const a = habits.filter(h => dueOn(h, dd(d))); return a.length && a.every(h => h.log[d]) }).length
    , weekly: habits.some(h => {
      const now = new Date();
      const monday = new Date(now);
      monday.setHours(0, 0, 0, 0);
      monday.setDate(now.getDate() - (now.getDay() + 6) % 7);

      let count = 0;
      for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        if (h.log[key(day)]) count++;
      }
      return count >= (h.weeklyTarget || 3);
    }) ? 1 : 0
  }
}
const BADGES = [
  { id: 'first', e: '🌱', n: 'First Step', d: 'Complete a habit', p: s => [s.total, 1] },
  { id: 's3', e: '🔥', n: 'On Fire', d: '3-day streak', p: s => [s.best, 3] },
  { id: 's7', e: '⚡', n: 'Week Warrior', d: '7-day streak', p: s => [s.best, 7] },
  { id: 's30', e: '👑', n: 'Habit Master', d: '30-day streak', p: s => [s.best, 30] },
  { id: 't25', e: '🎯', n: 'Getting Serious', d: '25 completions', p: s => [s.total, 25] },
  { id: 't100', e: '💎', n: 'Centurion', d: '100 completions', p: s => [s.total, 100] },
  { id: 'h5', e: '🧩', n: 'Collector', d: 'Track 5 habits', p: s => [s.count, 5] },
  { id: 'perfect', e: '🌟', n: 'Perfect Day', d: 'Finish every habit in one day', p: s => [s.perfect, 1] }
  , { id: 'weekly', e: '🏆', n: 'Weekly Champion', d: 'Complete a weekly goal', p: s => [s.weekly, 1] }];
const gotKey = () => 'ht_badges_' + user.id, got = () => JSON.parse(localStorage[gotKey()] || '[]');
function checkBadges(silent) {
  const s = gs(), g = got(), fresh = [];
  BADGES.forEach(b => { const [a, z] = b.p(s); if (a >= z && !g.includes(b.id)) { g.push(b.id); fresh.push(b) } });
  if (fresh.length) { localStorage[gotKey()] = JSON.stringify(g); if (!silent) { toast('🏆 Badge unlocked: ' + fresh[0].n); confetti(90) } }
}
function renderRewards() {
  const s = gs(), g = got(), xp = s.total * 10 + g.length * 50, lv = Math.floor(xp / 100) + 1;
  $('#lvNum').textContent = lv; $('#lvTitle').textContent = 'Level ' + lv + ' – ' + ['Seedling', 'Sprout', 'Builder', 'Achiever', 'Pro', 'Master', 'Legend'][Math.min(lv - 1, 6)];
  $('#xpText').textContent = `${xp % 100} / 100 XP to next level, ${g.length}/${BADGES.length} badges`; $('#xpBar').style.width = xp % 100 + '%';
  $('#badges').innerHTML = BADGES.map(b => { const [a, z] = b.p(s), un = g.includes(b.id); return `<div class="badge ${un ? '' : 'lock'}"><span class="be">${b.e}</span><b>${b.n}</b><small>${b.d}</small><div class="bar"><i style="width:${un ? 100 : Math.min(100, a / z * 100)}%"></i></div></div>` }).join('')
}

/* ---------- Calendar ---------- */
let cm = new Date(); cm.setDate(1); let selDay = key();
function renderCal() {
  const y = cm.getFullYear(), m = cm.getMonth(), first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate(); let h = '';
  $('#calTitle').textContent = cm.toLocaleDateString('en', { month: 'long', year: 'numeric' });
  for (let i = 0; i < first; i++)h += '<span></span>';
  for (let d = 1; d <= days; d++) { const k = key(new Date(y, m, d)); h += `<button class="cd ${k === key() ? 'today' : ''} ${k === selDay ? 'sel' : ''}" data-k="${k}" style="--a:${rate(k)}">${d}</button>` }
  $('#cal').innerHTML = h;
  $('#dayTitle').textContent = new Date(selDay + 'T00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
  const dl = habits.filter(h => dueOn(h, dd(selDay))); $('#dayList').innerHTML = dl.length ? dl.map(h => `<button class="drow" data-id="${h.id}"><span>${h.icon || '🎯'}</span><span class="dn"></span><span class="dc">${h.log[selDay] ? '✅' : '⬜'}</span></button>`).join('') : '<p class="legend">Nothing scheduled for this day.</p>';
  document.querySelectorAll('.dn').forEach((e, i) => e.textContent = dl[i].name)
}
$('#calPrev').onclick = () => { cm.setMonth(cm.getMonth() - 1); renderCal() };
$('#calNext').onclick = () => { cm.setMonth(cm.getMonth() + 1); renderCal() };
$('#cal').onclick = e => { const b = e.target.closest('.cd'); if (b) { selDay = b.dataset.k; renderCal() } };
$('#dayList').onclick = e => { const b = e.target.closest('.drow'); if (b && selDay <= key()) toggle(b.dataset.id, selDay) };

/* ---------- Profile ---------- */
function renderProfile() {
  const n = $('#pName'); if (document.activeElement !== n) n.value = S.names[user.id] || ''; n.placeholder = user.email.split('@')[0];
  $('#pMail').textContent = user.email; $('#soundOn').checked = S.sound; document.querySelectorAll('#themeSeg button').forEach(b => b.classList.toggle('on', b.dataset.t === S.theme))
}
$('#themeSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.theme = b.dataset.t; saveS(); applyTheme(); renderProfile(); toast('Theme: ' + b.textContent) };
$('#soundOn').onchange = e => { S.sound = e.target.checked; saveS() };
$('#pName').onchange = e => {
  const newName = e.target.value.trim();
  const oldName = S.names[user.id] || '';

  if (newName === oldName) return;

  if (!confirm('Are you sure you want to change your name?')) {
    e.target.value = oldName;
    return;
  }

  if (newName) {
    S.names[user.id] = newName;
  } else {
    delete S.names[user.id];
  }

  saveS();
  ident();
  renderProfile();
  toast('Name updated!');
};
$('#logoutBtn2').onclick = () => db.logout();

/* ---------- Profile Picture ---------- */

function showProfilePhoto() {
  if (!user) return;

  const photo = localStorage.getItem('ht_photo_' + user.id);
  const nameInput = document.querySelector('#pName');

  const initial =
    (nameInput?.value.trim().charAt(0) || user.email.charAt(0))
      .toUpperCase();

  ['#pAvatar', '#avatar'].forEach(selector => {
    const avatar = document.querySelector(selector);
    if (!avatar) return;

    avatar.style.backgroundImage = photo ? `url("${photo}")` : '';
    avatar.classList.toggle('has-photo', !!photo);

    if (!photo) {
      avatar.textContent = initial;
    }
  });
}

/* Update the existing profile renderer without deleting it */
const previousRenderProfile = renderProfile;

renderProfile = function () {
  previousRenderProfile();
  showProfilePhoto();
};

/* Choose a picture */



const photoInput = document.querySelector('#profilePhotoInput');

if (photoInput) {
  photoInput.onchange = event => {
    const file = event.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast('Choose a JPG, PNG or WebP image.');
      photoInput.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast('Image must be smaller than 5 MB.');
      photoInput.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        let zoom = 1;
        let offsetX = 0;
        let offsetY = 0;
        let dragging = false;
        let startX = 0;
        let startY = 0;
        let startOffsetX = 0;
        let startOffsetY = 0;

        const preview = document.createElement('div');
        preview.style.cssText = `
          position:fixed; inset:0; z-index:99999;
          background:rgba(10,18,35,.8);
          display:flex; align-items:center; justify-content:center;
          padding:16px; overflow:auto;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
          background:white; color:#222; border-radius:18px;
          padding:22px; width:100%; max-width:360px;
          box-sizing:border-box; text-align:center;
          max-height:95%; overflow:auto;
        `;

        const heading = document.createElement('h3');
        heading.textContent = 'Crop Profile Picture';

        const stage = document.createElement('div');
        stage.style.cssText = `
          width:240px; height:240px; max-width:100%;
          margin:16px auto; overflow:hidden; border-radius:50%;
          position:relative; background:#e9edf5;
          touch-action:none; cursor:grab;
        `;

        const image = document.createElement('img');
        image.src = reader.result;
        image.draggable = false;
        image.style.cssText = `
          position:absolute; max-width:none;
          user-select:none; pointer-events:none;
        `;

        const zoomLabel = document.createElement('label');
        zoomLabel.textContent = 'Zoom';
        zoomLabel.style.cssText = 'display:block;margin:14px 0 6px;';

        const zoomSlider = document.createElement('input');
        zoomSlider.type = 'range';
        zoomSlider.min = '1';
        zoomSlider.max = '3';
        zoomSlider.step = '0.05';
        zoomSlider.value = '1';
        zoomSlider.style.width = '100%';

        const hint = document.createElement('p');
        hint.textContent = 'Drag the photo to adjust the crop.';
        hint.style.cssText = 'font-size:13px;color:#667085;';

        const buttons = document.createElement('div');
        buttons.style.cssText = `
          display:flex; flex-wrap:wrap; gap:8px;
          justify-content:center; margin-top:18px;
        `;

        const makeButton = (text, primary) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = text;
          button.style.cssText = `
            padding:11px 15px; border-radius:10px;
            border:1px solid ${primary ? '#4776e6' : '#ccc'};
            background:${primary ? '#4776e6' : 'white'};
            color:${primary ? 'white' : '#222'};
            cursor:pointer; font-size:14px;
          `;
          return button;
        };

        const saveButton = makeButton('Save Picture', true);
        const cancelButton = makeButton('Cancel', false);

        const closePreview = () => preview.remove();

        function drawImage() {
          const box = stage.clientWidth;
          const baseScale = Math.max(
            box / img.naturalWidth,
            box / img.naturalHeight
          );
          const scale = baseScale * zoom;
          const width = img.naturalWidth * scale;
          const height = img.naturalHeight * scale;

          const minX = box - width;
          const minY = box - height;

          offsetX = Math.min(0, Math.max(minX, offsetX));
          offsetY = Math.min(0, Math.max(minY, offsetY));

          image.style.width = width + 'px';
          image.style.height = height + 'px';
          image.style.left = offsetX + 'px';
          image.style.top = offsetY + 'px';
        }

        zoomSlider.oninput = () => {
          const oldZoom = zoom;
          zoom = Number(zoomSlider.value);
          const ratio = zoom / oldZoom;
          const box = stage.clientWidth;

          offsetX = box / 2 - (box / 2 - offsetX) * ratio;
          offsetY = box / 2 - (box / 2 - offsetY) * ratio;

          drawImage();
        };

        stage.onpointerdown = e => {
          dragging = true;
          startX = e.clientX;
          startY = e.clientY;
          startOffsetX = offsetX;
          startOffsetY = offsetY;
          stage.style.cursor = 'grabbing';
          stage.setPointerCapture(e.pointerId);
        };

        stage.onpointermove = e => {
          if (!dragging) return;
          offsetX = startOffsetX + e.clientX - startX;
          offsetY = startOffsetY + e.clientY - startY;
          drawImage();
        };

        stage.onpointerup = () => {
          dragging = false;
          stage.style.cursor = 'grab';
        };

        stage.onpointercancel = () => {
          dragging = false;
          stage.style.cursor = 'grab';
        };

        cancelButton.onclick = () => {
          closePreview();
          photoInput.value = '';
        };

        saveButton.onclick = () => {
          try {
            const box = stage.clientWidth;
            const baseScale = Math.max(
              box / img.naturalWidth,
              box / img.naturalHeight
            );
            const scale = baseScale * zoom;

            const sourceX = Math.max(0, -offsetX / scale);
            const sourceY = Math.max(0, -offsetY / scale);
            const sourceSize = box / scale;

            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 320;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(
              img,
              sourceX, sourceY, sourceSize, sourceSize,
              0, 0, 320, 320
            );

            const photo = canvas.toDataURL('image/jpeg', 0.8);

            localStorage.setItem('ht_photo_' + user.id, photo);
            showProfilePhoto();
            closePreview();
            photoInput.value = '';
            toast('Profile picture updated!');
          } catch (error) {
            toast('Could not save the picture. Try another image.');
          }
        };

        stage.appendChild(image);
        buttons.append(saveButton, cancelButton);
        card.append(
          heading, stage, hint, zoomLabel, zoomSlider, buttons
        );
        preview.appendChild(card);
        document.body.appendChild(preview);

        drawImage();
      };

      img.onerror = () => {
        toast('Could not open this image.');
        photoInput.value = '';
      };

      img.src = reader.result;
    };

    reader.onerror = () => {
      toast('Could not read this image.');
      photoInput.value = '';
    };

    reader.readAsDataURL(file);
  };
}



/* Remove the picture */
const removePhotoBtn = document.querySelector('#removeProfilePhoto');

if (removePhotoBtn) {
  removePhotoBtn.onclick = () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;

    localStorage.removeItem('ht_photo_' + user.id);

    if (photoInput) photoInput.value = '';

    showProfilePhoto();
    toast('Profile picture removed.');
  };
}


/* ---------- Profile accordions ---------- */
function setupProfileAccordion(toggleId, panelId) {
  const toggle = document.getElementById(toggleId);
  const panel = document.getElementById(panelId);
  if (!toggle || !panel) return;
  toggle.onclick = () => {
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    toggle.setAttribute('aria-expanded', String(willOpen));
    const arrow = toggle.querySelector('.toggle-arrow');
    if (arrow) arrow.textContent = willOpen ? '⌃' : '⌄';
  };
}
setupProfileAccordion('securityToggle', 'securityPanel');
setupProfileAccordion('settingsToggle', 'settingsPanel');

/* ---------- Account Security ---------- */
const verifyBtn = $('#verifyEmailBtn');
if (verifyBtn) verifyBtn.onclick = async () => {
  try {
    await db.sendVerification();
    toast('Verification email sent. Check your inbox.');
  } catch (err) {
    toast(err.message || 'Could not send verification email.');
  }
};
const resetBtn = $('#resetPasswordBtn');
if (resetBtn) resetBtn.onclick = async () => {
  try {
    await db.resetPassword(user.email);
    toast('Password reset link sent to your email.');
  } catch (err) {
    toast(err.message || 'Could not send reset email.');
  }
};

/* ---------- Insights, backup ---------- */
function renderInsights() {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], byDay = Array(7).fill(0); let total = 0;
  habits.forEach(h => Object.keys(h.log).forEach(k => { byDay[dd(k).getDay()]++; total++ }));
  const top = [...habits].sort((a, b) => streak(b) - streak(a))[0], s = gs();
  const tiles = [['📅', total ? names[byDay.indexOf(Math.max(...byDay))] : '-', 'Your best day'], ['🏅', top && streak(top) ? top.name : '-', 'Longest current streak'], ['✅', total, 'Total completions'], ['⚡', s.best + ' days', 'Best streak ever']];
  $('#insGrid').innerHTML = tiles.map(t => `<div class="tile"><span>${t[0]}</span><b class="tv"></b><small>${t[2]}</small></div>`).join('');
  document.querySelectorAll('.tv').forEach((e, i) => e.textContent = tiles[i][1]);
}
$('#exportBtn').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: 'streaks', habits }, null, 2)], { type: 'application/json' })); a.download = 'streaks-backup-' + key() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); toast('Backup downloaded') };
$('#importBtn').onclick = () => $('#importFile').click();
$('#importFile').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text()); if (!Array.isArray(d.habits)) throw 0;
    d.habits.forEach(h => { if (!habits.some(x => x.id === String(h.id))) habits.push({ id: String(h.id), name: String(h.name).slice(0, 40), icon: h.icon || '🎯', color: h.color || COLORS[0], time: h.time || '', log: h.log || {}, ...(Array.isArray(h.days) ? { days: h.days } : {}) }) });
    persist(); render(); toast('Backup imported')
  } catch { toast('Invalid backup file') }
  e.target.value = ''
};

/* ---------- Habits ---------- */
const EMOJIS = ['💧', '📖', '🏃', '🧘', '💪', '🥗', '😴', '✍️', '🎧', '🧠', '🪥', '💊'];
const COLORS = ['#6366f1', '#10b981', '#e8b764', '#ef4444', '#06b6d4', '#ec4899'];
let selE = EMOJIS[0], selC = COLORS[0], view = 'today', filter = 'all', chart, animateNext = true, popId = null;
const persist = () => db.save(user.id, habits);
const ds = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d };
const rate = k => { const d = dd(k), a = habits.filter(h => dueOn(h, d)); return a.length ? a.filter(h => h.log[k]).length / a.length : 0 };
function streak(h) { let n = 0, d = new Date(); if (dueOn(h, d) && !h.log[key(d)]) d.setDate(d.getDate() - 1); for (let i = 0; i < 400; i++) { if (dueOn(h, d)) { if (h.log[key(d)]) n++; else break } d.setDate(d.getDate() - 1) } return n }
function buildPickers() {
  $('#dayPick').innerHTML = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((l, i) => `<button type="button" data-d="${i}" class="${selD.includes(i) ? 'sel' : ''}">${l}</button>`).join('');
  $('#colorPick').innerHTML = COLORS.map(c => `<button type="button" data-c="${c}" style="--c:${c}" class="${c === selC ? 'sel' : ''}" aria-label="${c}"></button>`).join('');
}
$('#colorPick').onclick = e => { const b = e.target.closest('button'); if (b) { selC = b.dataset.c; buildPickers() } };
let editing = null, selD = [0, 1, 2, 3, 4, 5, 6];
$('#dayPick').onclick = e => { const b = e.target.closest('button'); if (!b) return; const d = +b.dataset.d; selD = selD.includes(d) ? selD.filter(x => x !== d) : [...selD, d]; buildPickers() };
const openAdd = h => {
  editing = h && h.id ? h : null; selE = editing ? editing.icon || '' : ''; selD = editing ? (editing.days || [0, 1, 2, 3, 4, 5, 6]) : [0, 1, 2, 3, 4, 5, 6];
  selC = editing ? (editing.color || COLORS[0]) : selC;
  $('#habitName').value = editing ? editing.name : ''; $('#weeklyTarget').value = editing ? (editing.weeklyTarget || 3) : 3; $('#habitTime').value = editing ? editing.time || '' : '';
  $('#modalTitle').textContent = editing ? 'Edit habit' : 'New habit'; $('#saveBtn').textContent = editing ? 'Save changes' : 'Save habit';
  buildPickers(); $('#addModal').hidden = false; $('#habitName').focus(); askNotif()
};
$('#openAdd').onclick = () => openAdd(); $('#emptyAdd').onclick = () => openAdd();
addEventListener('keydown', e => {
  if (e.key === 'Escape') $('#addModal').hidden = true;
  if (e.key === 'n' && user && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && $('#addModal').hidden && $('#alarm').hidden) { e.preventDefault(); openAdd() }
});
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => $('#addModal').hidden = true);
$('#addModal').onclick = e => { if (e.target.id === 'addModal') e.target.hidden = true };
const VIEWS = ['today', 'cal', 'stats', 'rewards', 'profile'];
function setView(v) {
  view = v; animateNext = true; document.querySelectorAll('.nav[data-view]').forEach(x => x.classList.toggle('active', x.dataset.view === v));
  VIEWS.forEach(n => { const s = $('#v-' + n); s.hidden = n !== v; if (n === v) { s.classList.remove('view-in'); void s.offsetWidth; s.classList.add('view-in') } }); titles(); render(); scrollTo({ top: 0 })
}
document.querySelectorAll('.nav[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
$('#filters').onclick = e => {
  const b = e.target.closest('button'); if (!b) return; filter = b.dataset.f; animateNext = true;
  document.querySelectorAll('#filters .chip-btn').forEach(x => x.classList.toggle('active', x === b)); render()
};
function render() {
  const k = key(), due = habits.filter(h => dueOn(h, new Date())), done = due.filter(h => h.log[k]).length, p = Math.round(rate(k) * 100);
  $('#ring').style.setProperty('--v', p); num($('#pct'), p, '%');
  $('#doneText').textContent = `${done} / ${due.length}`;
  num($('#bestStreak'), Math.max(0, ...habits.map(streak)), ' days');
  num($('#weekDone'), habits.reduce((s, h) => s + [...Array(7).keys()].filter(i => h.log[key(ds(i))]).length, 0));
  num($('#activeCount'), habits.length);
  $('#empty').hidden = habits.length > 0;
  const list = $('#list'); list.innerHTML = ''; if (habits.length && !due.length) list.innerHTML = '<p class="rest">🌴 Rest day, nothing scheduled today.</p>';
  due.filter(h => filter === 'all' || (filter === 'done') === !!h.log[k]).forEach((h, idx) => {
    const on = !!h.log[k], el = document.createElement('article');

    const now = new Date();
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - (now.getDay() + 6) % 7);

    let weeklyDone = 0;
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dateKey = key(day);
      if (h.log[dateKey]) weeklyDone++;
    }

    const weeklyTarget = h.weeklyTarget || 3;
    const weeklyPercent = Math.min(
      100,
      Math.round((weeklyDone / weeklyTarget) * 100)
    );

    el.className = 'habit' + (on ? ' done' : '') + (animateNext ? ' enter' : ''); el.style.setProperty('--i', idx); el.style.setProperty('--c', h.color || COLORS[0]);
    let wk = ''; for (let i = 6; i >= 0; i--) { const d = ds(i); wk += `<div class="day">${d.toLocaleDateString('en', { weekday: 'narrow' })}<i class="${h.log[key(d)] ? 'on' : ''}"></i></div>` }
    el.innerHTML = `<div class="h-top"><span class="h-ico"></span><span class="h-name"></span>
      <button class="icon-btn edit" aria-label="Edit habit">${ic('edit')}</button><button class="icon-btn del" aria-label="Delete habit">${ic('trash')}</button></div>
      <div class="chips"><span class="chip fire">🔥 ${streak(h)} day streak</span>${h.time ? `<span class="chip bell">⏰ ${h.time}</span>` : ''}${h.days && h.days.length < 7 ? `<span class="chip">📅 ${h.days.map(d => 'SMTWTFS'[d]).join(' ')}</span>` : ''}</div>
      <div class="weekly-progress">
        <div class="weekly-label">
          <span>Weekly goal</span>
          <span>${weeklyDone}/${weeklyTarget} this week</span>
        </div>
        <div class="bar">
          <i style="width:${weeklyPercent}%"></i>
        </div>
        ${weeklyDone >= weeklyTarget
        ? '<small>🏆 Weekly goal completed!</small>'
        : ''}
      </div>

      <div class="h-bot"><div class="week">${wk}</div><button class="check ${on ? 'on' : ''}${popId === h.id ? ' pop' : ''}" aria-label="Mark done">${ic('check')}</button></div>`;
    el.querySelector('.h-name').textContent = h.name;
    el.querySelector('.check').onclick = () => toggle(h.id);
    el.querySelector('.edit').onclick = () => openAdd(h);
    el.querySelector('.del').onclick = () => { const i = habits.indexOf(h); habits.splice(i, 1); persist(); render(); toast('Habit deleted', { l: 'Undo', f: () => { habits.splice(i, 0, h); persist(); render() } }) };
    list.append(el);
  });
  animateNext = false; popId = null;
  if (view === 'stats') renderStats(); if (view === 'cal') renderCal(); if (view === 'rewards') renderRewards(); if (view === 'profile') renderProfile();
  checkBadges();
}
function renderStats() {
  renderInsights();
  const labels = [], data = []; for (let i = 6; i >= 0; i--) { const d = ds(i); labels.push(d.toLocaleDateString('en', { weekday: 'short' })); data.push(Math.round(rate(key(d)) * 100)) }
  chart && chart.destroy();
  chart = new Chart($('#chart'), {
    type: 'bar', data: { labels, datasets: [{ data, backgroundColor: '#d1d1de', borderRadius: 8, maxBarThickness: 42 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.raw + '% completed' } } }, scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' }, grid: { color: 'rgba(148,163,184,.2)' } }, x: { grid: { display: false } } } }
  });
  let heat = ''; for (let i = 34; i >= 0; i--)heat += `<span style="--a:${rate(key(ds(i)))}" title="${key(ds(i))}"></span>`;
  $('#heat').innerHTML = heat;
  $('#rates').innerHTML = habits.length ? habits.map(h => {
    const dueD = [...Array(30).keys()].filter(i => dueOn(h, ds(i))).length || 1, n = [...Array(30).keys()].filter(i => h.log[key(ds(i))]).length, pc = Math.min(100, Math.round(n / dueD * 100));
    return `<div class="rate" style="--c:${h.color || COLORS[0]}"><div><span>${h.icon || '🎯'} <span class="rn"></span></span><span>${pc}%</span></div><div class="bar"><i style="width:${pc}%"></i></div></div>`
  }).join('') : '<p class="legend">Add habits to see your success rate.</p>';
  document.querySelectorAll('.rn').forEach((e, i) => e.textContent = habits[i].name);
}
function toggle(id, k = key()) {
  const h = habits.find(x => x.id === id), t = k === key();
  if (h.log[k]) { delete h.log[k] } else { h.log[k] = true; if (t) { popId = id; if (rate(k) === 1) { toast('🎉 All habits done today!'); confetti() } else toast('Nice! Keep it going 🔥') } }
  persist(); render()
}
$('#habitForm').onsubmit = e => {
  e.preventDefault();
  const name = $('#habitName').value.trim(); if (!name) return;
  if (!selD.length) { toast('Select at least one day'); return }
  const time = $('#habitTime').value, days = selD.length < 7 ? [...selD].sort() : null, weeklyTarget = Number($('#weeklyTarget').value) || 3, wasEditing = !!editing;
  if (editing) {
    editing.name = name.slice(0, 40); editing.time = time; editing.color = selC; editing.weeklyTarget = weeklyTarget;
    if (days) editing.days = days; else delete editing.days;
  } else {
    const h = { id: Date.now().toString(36), name: name.slice(0, 40), icon: '', color: selC, time, log: {}, weeklyTarget };
    if (days) h.days = days;
    habits.push(h);
  }
  e.target.reset(); $('#addModal').hidden = true; persist(); render(); toast(wasEditing ? 'Habit updated' : 'Habit added');
};

/* ---------- Alarm ---------- */
let current = null, beepTimer;
function beep() {
  if (!S.sound) return;
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)(); let t = c.currentTime;
    for (let i = 0; i < 6; i++) {
      const o = c.createOscillator(), g = c.createGain(); o.frequency.value = i % 2 ? 880 : 660;
      g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.001, t + .25); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .25); t += .3;
    }
  } catch { }
}
function ring(h) {
  current = h; $('#alarmText').textContent = h.name; $('#alarm').hidden = false; beep(); clearInterval(beepTimer); beepTimer = setInterval(beep, 4000); if ('Notification' in window && Notification.permission === 'granted') new Notification('Habit reminder', { body: h.name });
}
function stopRing() { clearInterval(beepTimer); $('#alarm').hidden = true; }
$('#alarmDone').onclick = () => { stopRing(); if (current && !current.log[key()]) toggle(current.id); };
$('#alarmSnooze').onclick = () => { stopRing(); snoozed[current.id] = Date.now() + 5 * 60000; };
$('#alarmClose').onclick = stopRing;
setInterval(() => {
  if (!user) return; const n = new Date(), hm = n.toTimeString().slice(0, 5), stamp = key() + hm;
  habits.forEach(h => {
    if (h.log[key()] || !dueOn(h, n)) return;
    if (h.time === hm && rang[h.id] !== stamp) { rang[h.id] = stamp; ring(h); }
    else if (snoozed[h.id] && Date.now() >= snoozed[h.id]) { delete snoozed[h.id]; ring(h); }
  });
}, 5000);

/* ---------- Browser Notifications ---------- */
function askNotif() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(updNotif);
  }
}
function updNotif() {
  const b = $('#notifBtn');
  if (!b) return;
  if (!('Notification' in window)) {
    b.textContent = 'Not supported';
    b.disabled = true;
    return;
  }
  if (Notification.permission === 'denied') {
    b.textContent = 'Blocked in browser';
    b.disabled = false;
    return;
  }
  const enabled = localStorage.getItem('browserNotificationsEnabled') === 'true';
  b.textContent = enabled ? 'Disable' : 'Enable';
  b.disabled = false;
}
const notifBtn = $('#notifBtn');
if (notifBtn) notifBtn.onclick = async () => {
  if (!('Notification' in window)) {
    toast('Browser notifications are not supported.');
    updNotif();
    return;
  }
  if (Notification.permission === 'denied') {
    toast('Allow notifications in your browser settings first.');
    updNotif();
    return;
  }
  const enabled = localStorage.getItem('browserNotificationsEnabled') === 'true';
  if (enabled) {
    localStorage.setItem('browserNotificationsEnabled', 'false');
    toast('Browser notifications disabled.');
    updNotif();
    return;
  }
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission === 'granted') {
    localStorage.setItem('browserNotificationsEnabled', 'true');
    toast('Browser notifications enabled.');
  } else {
    localStorage.setItem('browserNotificationsEnabled', 'false');
    toast('Notifications were not enabled.');
  }
  updNotif();
};
updNotif();

/* ---------- Quote (free API with offline fallback) ---------- */

const QUOTES = [
  "Small steps every day add up.",
  "Don't break the chain.",
  "Discipline is choosing what you want most over what you want now.",
  "You don't have to be perfect, just consistent.",
  "Progress is progress, no matter how small.",
  "Your future is built by what you do today.",
  "One good habit can change your whole day.",
  "Start where you are. Use what you have.",
  "Consistency beats intensity.",
  "A little progress each day adds up to big results.",
  "You are allowed to grow at your own pace.",
  "Every day is another chance to improve.",
  "Keep going, even when progress feels slow.",
  "Success starts with showing up.",
  "Make yourself proud.",
  "Your habits shape your future.",
  "You can restart as many times as you need.",
  "Focus on progress, not perfection.",
  "Small actions create big changes.",
  "Be patient with yourself.",
  "You are building something meaningful.",
  "Don't give up on the person you're becoming.",
  "A bad day doesn't erase your progress.",
  "One step at a time is still moving forward.",
  "Choose progress over excuses.",
  "Keep your promises to yourself.",
  "The secret is to keep showing up.",
  "You are stronger than your excuses.",
  "Little by little, a little becomes a lot.",
  "Your effort matters, even when nobody sees it.",
  "You don't need to feel ready to begin.",
  "Every small win counts.",
  "Build routines that support your dreams.",
  "Make today count.",
  "Be consistent, not perfect.",
  "Growth takes time. Trust the process.",
  "You can do hard things one step at a time.",
  "Your only competition is who you were yesterday.",
  "A fresh start can begin at any moment.",
  "Keep watering the habits you want to grow.",
  "Dream big, start small.",
  "Action creates motivation.",
  "Do something today your future self will thank you for.",
  "You are making more progress than you realize.",
  "Don't let one missed day become two.",
  "The best time to begin is now.",
  "Show up for yourself today.",
  "Small habits lead to lasting change.",
  "Be proud of every step forward.",
  "Your journey is yours alone.",
  "Keep learning, keep growing.",
  "A little discipline creates more freedom.",
  "You can make a different choice today.",
  "Every repetition makes the habit stronger.",
  "Patience is part of progress.",
  "Your goals deserve your effort.",
  "Keep your focus on what you can control.",
  "A slow journey can still take you far.",
  "Turn your intentions into actions.",
  "Make consistency your superpower.",
  "You are allowed to begin again.",
  "Don't wait for motivation; build a routine.",
  "Celebrate the effort, not just the outcome.",
  "You are capable of learning new patterns.",
  "Better days are built one choice at a time.",
  "Your small wins are worth celebrating.",
  "Take the next step, however small.",
  "You don't need a perfect plan to start.",
  "Keep moving toward what matters to you.",
  "Be gentle with yourself and keep going.",
  "Every day you practice, you improve.",
  "You are building trust with yourself.",
  "Make room for growth.",
  "Today's effort is tomorrow's strength.",
  "Keep showing up, especially for yourself.",
  "You can improve without rushing.",
  "Your habits are votes for the person you want to be.",
  "Focus on the next step, not the whole staircase.",
  "One choice can be the start of a new pattern.",
  "Your progress doesn't need to look like anyone else's.",
  "Do it for the future you imagine.",
  "Small beginnings can lead to great things.",
  "Keep your goals close and your next step simple.",
  "You have made it through difficult days before.",
  "Make progress your daily goal.",
  "Consistency turns effort into routine.",
  "Be curious about how much you can grow.",
  "A little effort is better than none.",
  "You deserve the patience you give others.",
  "You can always choose to try again.",
  "Let your actions reflect your priorities.",
  "Celebrate how far you've come.",
  "Your next chapter starts with today's choices.",
  "Stay committed to your own growth.",
  "Give yourself credit for trying.",
  "Keep building, one day at a time.",
  "You are not behind; you are learning.",
  "A meaningful life is built from ordinary days.",
  "Make your habits work for you.",
  "Start small, stay steady, keep growing.",
  "You are worth the effort it takes to care for yourself.",
  "Keep going. Your small steps matter."
];

function setQuote(text) {
  $('#quote').textContent = $('#dQuote').textContent = text;
}

function showRandomQuote() {
  const historyKey = 'ht_quote_history';
  let history = [];

  try {
    history = JSON.parse(localStorage.getItem(historyKey) || '[]');
  } catch (e) {
    history = [];
  }

  // Forget the old cycle once every quote has been used.
  if (!Array.isArray(history) || history.length >= QUOTES.length) {
    history = [];
  }

  const available = QUOTES
    .map((quote, index) => ({ quote, index }))
    .filter(item => !history.includes(item.index));

  const choice = available[
    Math.floor(Math.random() * available.length)
  ];

  history.push(choice.index);
  localStorage.setItem(historyKey, JSON.stringify(history));
  setQuote(choice.quote);
}

showRandomQuote();


/* ---------- Boot ---------- */
(async () => {
  try {
    db = DEMO ? demo : await firebaseBackend();
  } catch (e) {
    console.error('Firebase load error:', e);
    $('#authError').textContent = 'Could not load Firebase. Check your internet connection and refresh.';
    return;
  }
  $('#modeHint').textContent = DEMO ? 'Demo mode: data is saved only in this browser. Add Firebase keys to sync across devices.' : '';
  paint(); setMode('login'); updNotif();
  db.init(async u => {
    user = u; $('#auth').hidden = !!u; $('#app').hidden = !u;
    if (u) {
      try { habits = await db.load(u.id); }
      catch (e) { console.error('Load error:', e); habits = []; toast('Could not load your habits. Check Firestore rules.'); }
      $('#dateText').textContent = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
      ident(); setView('today'); checkBadges(true);
    } else { habits = []; $('#authForm').reset(); }
  });
})();

/* Sync pending offline habits when internet returns */
window.addEventListener('online', async () => {
  if (!user || !db) return;

  const id = user.id;
  const dirtyKey = 'ht_dirty_' + id;
  const localKey = 'ht_data_' + id;

  if (localStorage.getItem(dirtyKey) !== 'true') return;

  try {
    const savedHabits = JSON.parse(
      localStorage.getItem(localKey) || '[]'
    );

    await db.save(id, savedHabits);

    console.log('Internet is back. Pending sync attempted.');
  } catch (error) {
    console.error('Offline sync failed:', error);
  }
});

