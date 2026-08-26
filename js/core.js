/* HOKAGE — core: state (v2, migrates v1), identity, scrolls, the day, the run engine, sharing. No DOM. */
(function (G) {
  'use strict';
  var KEY = 'HOKAGE_V1', TAG = 'HOKAGE1:';
  G.VERSION = 'v5.0.0';
  G.KEY = KEY;

  /* ---------- storage seam (swappable for tests) ---------- */
  G.storage = {
    get: function () { try { return (typeof localStorage !== 'undefined') ? localStorage.getItem(KEY) : null; } catch (e) { return null; } },
    set: function (s) { try { if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, s); return true; } catch (e) { return false; } },
    del: function () { try { if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY); } catch (e) {} }
  };
  G.now = function () { return Date.now(); };
  G.clock = function () { return new Date(G.now()); };
  /* the logical day: the shinobi day begins at DAY_START (default 4 AM) — the night belongs to the night.
     Only "what day is now" shifts; explicit dates (addDays etc) are never shifted. */
  G.dayStart = function () { var p = G.state && G.state.prefs; return (p && p.dayStart != null) ? p.dayStart : 4; };
  G.logicalNow = function () { return new Date(G.now() - G.dayStart() * 3600e3); };

  /* ---------- tiny utils ---------- */
  G.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  G.key = function (d) { d = d || G.logicalNow(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  G.today = function () { return G.key(); };
  G.dow = function () { return G.logicalNow().getDay(); };
  G.addDays = function (key, n) { var p = key.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); d.setDate(d.getDate() + n); return G.key(d); };
  G.fmt = function (s) { s = +s; if (!isFinite(s)) s = 0; s = Math.max(0, Math.round(s)); var m = Math.floor(s / 60); return m ? m + ':' + String(s % 60).padStart(2, '0') : s + 's'; };
  G.fmtN = function (n) { n = +n; if (!isFinite(n)) n = 0; n = Math.round(n); return n >= 10000 ? (Math.round(n / 100) / 10) + 'k' : String(n); };
  function uid(p) { return (p || 'x') + Math.random().toString(36).slice(2, 9); }
  G.uid = uid;
  G.clamp = function (n, a, b) { n = +n; if (!isFinite(n)) n = a; return Math.min(b, Math.max(a, n)); };
  G.deep = function (o) { return JSON.parse(JSON.stringify(o)); };

  /* ---------- event bus ---------- */
  var subs = {};
  G.on = function (ev, fn) { (subs[ev] = subs[ev] || []).push(fn); };
  G.emit = function (ev, data) { (subs[ev] || []).forEach(function (fn) { try { fn(data); } catch (e) { if (G.onError) G.onError(e); } }); };

  /* ---------- state ---------- */
  function freshState() {
    return { v: 2, name: '', village: null, clan: null, sName: null, reg: '', rankIdx: 0, score: 0, missions: 0, sealedDays: 0, epithet: '', akatsuki: false,
      log: {}, protocols: {}, dogu: { items: {}, seeded: 0 }, run: null,
      nindo: '', sensei: null, chakra: 0, ryo: 0, ryoEarned: 0,
      jutsu: { charges: 0, used: {}, lastEarnAt: 0, rasengans: 0 },
      exam: null, exams: { passed: [], failed: 0 }, bounties: {}, letters: [0], cosmetics: { owned: [], headband: '', frame: '' },
      seen: {}, prefs: { sound: true, haptics: true, motion: 'auto', dayStart: 4, weekStart: 'mon', textScale: 'm', riskHour: 20, backupNudge: true }, weeks: {}, created: G.today(), lastSeen: '', inbox: [] };
  }
  G.load = function () {
    var st = null;
    try { st = JSON.parse(G.storage.get()); } catch (e) {}
    if (!st || typeof st !== 'object') st = {};
    var base = freshState(), migratedFrom = st.v;
    Object.keys(base).forEach(function (k) { if (st[k] === undefined || st[k] === null && base[k] !== null) st[k] = base[k]; });
    st.v = 2;
    /* scalars */
    st.name = String(st.name || '').slice(0, 24);
    if (!G.VILLAGES[st.village]) st.village = null;
    if (!st.clan || !st.clan.id) st.clan = null;
    st.rankIdx = G.clamp(st.rankIdx | 0, 0, 6);
    ['score', 'missions', 'sealedDays', 'chakra', 'ryo', 'ryoEarned'].forEach(function (k) { st[k] = Math.max(0, st[k] | 0); });
    st.epithet = String(st.epithet || '').slice(0, 60);
    st.nindo = String(st.nindo || '').slice(0, 120);
    st.akatsuki = !!st.akatsuki;
    if (st.sensei && !G.SENSEI.some(function (s) { return s.id === st.sensei; })) st.sensei = null;
    /* objects */
    ['log', 'protocols', 'bounties', 'weeks'].forEach(function (k) { if (!st[k] || typeof st[k] !== 'object') st[k] = {}; });
    if (!st.jutsu || typeof st.jutsu !== 'object') st.jutsu = base.jutsu;
    st.jutsu.charges = G.clamp(st.jutsu.charges | 0, 0, 9); if (!st.jutsu.used || typeof st.jutsu.used !== 'object') st.jutsu.used = {};
    st.jutsu.lastEarnAt = st.jutsu.lastEarnAt | 0; st.jutsu.rasengans = st.jutsu.rasengans | 0;
    if (!st.exams || typeof st.exams !== 'object') st.exams = base.exams;
    if (!Array.isArray(st.exams.passed)) st.exams.passed = []; st.exams.failed = st.exams.failed | 0;
    if (st.exam && (typeof st.exam !== 'object' || !st.exam.start)) st.exam = null;
    if (!Array.isArray(st.letters)) st.letters = [0];
    if (!Array.isArray(st.inbox)) st.inbox = [];
    if (!st.cosmetics || typeof st.cosmetics !== 'object') st.cosmetics = base.cosmetics;
    if (!Array.isArray(st.cosmetics.owned)) st.cosmetics.owned = [];
    if (!st.prefs || typeof st.prefs !== 'object') st.prefs = base.prefs;
    st.prefs.sound = st.prefs.sound !== false; st.prefs.haptics = st.prefs.haptics !== false;
    if ([0, 2, 4, 6].indexOf(st.prefs.dayStart) < 0) st.prefs.dayStart = 4;
    if (['mon', 'sun'].indexOf(st.prefs.weekStart) < 0) st.prefs.weekStart = 'mon';
    if (['s', 'm', 'l'].indexOf(st.prefs.textScale) < 0) st.prefs.textScale = 'm';
    st.prefs.riskHour = G.clamp(st.prefs.riskHour == null ? 20 : st.prefs.riskHour, 17, 23);
    st.prefs.backupNudge = st.prefs.backupNudge !== false;
    if (!st.seen || typeof st.seen !== 'object') st.seen = {};
    st.lastBackupAt = st.lastBackupAt || '';
    /* v1 → v2: a veteran keeps their rank — the exams behind them are marked passed. */
    if (migratedFrom === 1) {
      for (var r = 1; r <= st.rankIdx; r++) if (st.exams.passed.indexOf(r) < 0) st.exams.passed.push(r);
      for (var l = 1; l <= st.rankIdx; l++) if (st.letters.indexOf(l) < 0) st.letters.push(l);
      st.chakra = st.chakra || Math.round(st.score * 12);
      st.ryo = st.ryo || st.missions * 60; st.ryoEarned = st.ryoEarned || st.ryo;
      st.inbox.push({ k: '更', t: 'The village was rebuilt', b: 'Your record, rank and scrolls crossed over intact. New: chakra, ryō, jutsu, exams, a sensei, the Bingo Book and the Market. Start on the Card.' });
    }
    /* protocols */
    var baseP = G.baseProtocols();
    ['asageiko', 'fuin'].forEach(function (k) { if (!st.protocols[k] || !Array.isArray(st.protocols[k].movements)) st.protocols[k] = baseP[k]; });
    Object.keys(st.protocols).forEach(function (pid) {
      var p = st.protocols[pid];
      if (!p || !Array.isArray(p.movements)) { delete st.protocols[pid]; return; }
      p.id = pid;
      p.name = String(p.name || 'Scroll').slice(0, 30); p.kanji = String(p.kanji || '巻').slice(0, 2);
      p.en = String(p.en || '').slice(0, 40);
      p.mode = p.mode === 'seal' ? 'seal' : 'mission';
      p.schedule = ['am', 'pm', 'any'].indexOf(p.schedule) >= 0 ? p.schedule : 'any';
      p.movements = p.movements.filter(function (m) { return m && typeof m === 'object'; }).slice(0, 60);
      p.movements.forEach(function (m) {
        m.id = typeof m.id === 'string' ? m.id : uid('m');
        m.name = String(m.name || 'Step').slice(0, 80);
        m.cue = String(m.cue || '').slice(0, 300);
        m.type = G.TYPES[m.type] ? m.type : 'open';
        m.opt = !!m.opt;
        m.secs = +m.secs; if (!isFinite(m.secs) || m.secs < 0) m.secs = (m.type === 'timed' || m.type === 'breath') ? 60 : 0;
        m.reps = +m.reps; if (!isFinite(m.reps) || m.reps < 1) m.reps = 10;
        if (m.type === 'breath') {
          if (!Array.isArray(m.breath) || m.breath.length !== 5 || m.breath.some(function (x) { return !isFinite(+x); })) m.breath = [4, 4, 4, 4, 5];
          m.breath = m.breath.map(Number);
          m.secs = (m.breath[0] + m.breath[1] + m.breath[2] + m.breath[3]) * m.breath[4] || 60;
        }
        if (m.ref && (!m.ref.url || !/^https?:\/\//.test(m.ref.url))) delete m.ref;
        if (m.ref) { m.ref.url = String(m.ref.url).slice(0, 300); m.ref.note = String(m.ref.note || '').slice(0, 120); }
        if (m.img != null && typeof m.img !== 'string') delete m.img;
        m.secs = G.clamp(m.secs | 0, 0, 7200);
        m.reps = G.clamp(m.reps | 0, 1, 500);
        if (m.days && (!Array.isArray(m.days) || !m.days.length || m.days.length >= 7)) delete m.days;
        if (m.log) m.log = String(m.log).slice(0, 8);
        if (m.type === 'breath' && !Array.isArray(m.breath)) m.breath = [4, 4, 4, 4, 4];
      });
    });
    if (!st.dogu || typeof st.dogu !== 'object') st.dogu = { items: {}, seeded: 0 };
    if (!st.dogu.items) st.dogu.items = {};
    if (!st.dogu.seeded && !Object.keys(st.dogu.items).length) {
      G.KIT.forEach(function (k) { st.dogu.items[k[0]] = { slot: k[1], cat: k[2], name: k[3], price: k[4], url: '', owned: false }; });
      st.dogu.seeded = 1;
    }
    if (st.run && (!st.run.pid || !st.protocols[st.run.pid])) st.run = null;
    if (st.run && st.run.timer && typeof st.run.timer !== 'object') st.run.timer = null;
    G.state = st;
    if (G.ensureClimb) G.ensureClimb(st);
    if (G.onLoad) G.onLoad(st);
    return st;
  };
  G.save = function () { var ok = G.storage.set(JSON.stringify(G.state)); if (!ok) G.emit('saveFail'); G.emit('change'); return ok; };
  G.resetAll = function () { G.storage.del(); G.load(); };
  G.exportData = function () { G.state.lastBackupAt = G.today(); G.save(); return JSON.stringify(G.state); };
  G.importData = function (txt) {
    var o = JSON.parse(txt);
    if (!o || typeof o !== 'object' || (o.v !== 1 && o.v !== 2)) throw new Error('Not a HOKAGE backup');
    G.storage.set(JSON.stringify(o)); G.load();
  };

  /* ---------- identity ---------- */
  G.rollClan = function (rng) {
    rng = rng || Math.random;
    var roll = rng() * 100, acc = 0, tier = 'common';
    for (var ti = 0; ti < G.TIER_ODDS.length; ti++) { acc += G.TIER_ODDS[ti][1]; if (roll < acc) { tier = G.TIER_ODDS[ti][0]; break; } }
    var pool = G.CLANS.filter(function (x) { return x[2] === tier; });
    var cl = pool[Math.floor(rng() * pool.length)];
    return { id: cl[0], name: cl[1], tier: cl[2], perk: cl[3] };
  };
  G.enroll = function (vid, realName, nindo) {
    var st = G.state;
    st.village = vid; st.name = String(realName || 'Shinobi').slice(0, 24);
    st.nindo = String(nindo || '').slice(0, 120);
    st.sName = G.forgeName(st.name);
    st.clan = G.rollClan();
    st.reg = 'HK-' + Math.floor(1000 + Math.random() * 9000);
    if (!st.created) st.created = G.today();
    G.save();
  };
  G.setSensei = function (id) { if (G.SENSEI.some(function (s) { return s.id === id; })) { G.state.sensei = id; G.save(); } };
  G.sensei = function () { var id = G.state.sensei; for (var i = 0; i < G.SENSEI.length; i++) if (G.SENSEI[i].id === id) return G.SENSEI[i]; return null; };
  G.clanPerk = function (k, dflt) { var c = G.state.clan && G.CLAN_PERKS[G.state.clan.id]; return (c && c[k] != null) ? c[k] : dflt; };
  G.senseiPerk = function (k) { var s = G.sensei(); return !!(s && s.perkKey === k); };
  G.rankInfo = function () {
    var st = G.state, i = st.rankIdx, next = G.RANKS[i + 1];
    return { idx: i, name: i === 6 ? (G.VILLAGES[st.village] || {}).kage || 'Kage' : G.RANKS[i][0], next: next ? { name: next[0], at: next[1], left: Math.max(0, next[1] - st.score) } : null };
  };
  var SURNAMES = [['嵐谷', 'Arashitani', 'the storm valley'], ['火村', 'Himura', 'the fire village'], ['影山', 'Kageyama', 'the shadow mountain'], ['雷田', 'Raida', 'the thunder field'], ['月島', 'Tsukishima', 'the moon isle'], ['鋼橋', 'Kōhashi', 'the steel bridge'], ['夜森', 'Yomori', 'the night forest'], ['白川', 'Shirakawa', 'the white river'], ['龍崎', 'Ryūzaki', 'the dragon cape'], ['砂原', 'Sunahara', 'the sand plain']];
  var GIVENS = [['烈', 'Retsu', 'the fierce'], ['真', 'Shin', 'the true'], ['隼', 'Hayato', 'the falcon'], ['剣', 'Ken', 'the blade'], ['嵐', 'Ran', 'the storm'], ['轟', 'Gō', 'the roar'], ['閃', 'Sen', 'the flash'], ['雷', 'Rai', 'the thunderclap'], ['猛', 'Takeru', 'the fierce tide'], ['凛', 'Rin', 'the unshaken']];
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return Math.abs(h); }
  G.forgeName = function (realName) {
    var h = hash(realName + '|' + (G.state.village || ''));
    var sn = SURNAMES[h % SURNAMES.length];
    var gv = GIVENS[Math.floor(h / 7) % GIVENS.length];
    return { k: sn[0] + ' ' + gv[0], r: sn[1] + ' ' + gv[1], m: gv[2] + ' of ' + sn[2] };
  };
  G.forgeEpithet = function () {
    var v = G.VILLAGES[G.state.village] || G.VILLAGES.konoha;
    var pool = G.EPITHETS[v.nature] || G.EPITHETS.fire;
    var pick = pool[Math.floor(Math.random() * pool.length)];
    var vs = v.en.replace('Hidden ', '');
    var forms = ['The ' + pick + ' of the ' + vs, vs + '\u2019s ' + pick, pick + ' of the ' + vs];
    return forms[Math.floor(Math.random() * forms.length)];
  };

  /* ---------- the chain ---------- */
  G.daySealed = function (k) { var day = G.state.log[k]; return !!(day && Object.keys(day).some(function (p) { return day[p].sealed; })); };
  G.dayCovered = function (k) { return G.daySealed(k) || !!G.state.jutsu.used[k]; };
  G.streak = function () {
    var n = 0, k = G.today();
    if (!G.dayCovered(k)) k = G.addDays(k, -1);
    while (G.dayCovered(k) && n < 3650) { n++; k = G.addDays(k, -1); }
    return n;
  };
  G.lastSealedKey = function () {
    var best = null;
    Object.keys(G.state.log).forEach(function (k) { if (G.daySealed(k) && (!best || k > best)) best = k; });
    return best;
  };

  /* ---------- protocols ---------- */
  G.userScrolls = function () { return Object.keys(G.state.protocols).filter(function (p) { var x = G.state.protocols[p]; return !x.builtin && x.kind !== 'path'; }); };
  G.userPaths = function () { return Object.keys(G.state.protocols).filter(function (p) { return G.state.protocols[p].kind === 'path'; }); };
  G.newScroll = function (kind) {
    var pid = uid('p');
    G.state.protocols[pid] = { id: pid, name: kind === 'path' ? 'New Path' : 'New Scroll', kanji: kind === 'path' ? '道' : '巻', en: '', mode: 'mission', schedule: 'any', kind: kind === 'path' ? 'path' : undefined, movements: [] };
    G.save(); return pid;
  };
  G.deleteProtocol = function (pid) {
    var p = G.state.protocols[pid]; if (!p) return false;
    if (p.builtin) { var base = G.baseProtocols(); G.state.protocols[pid] = base[pid]; G.save(); return 'reset'; }
    delete G.state.protocols[pid]; G.save(); return true;
  };
  G.materializePath = function (i, released) {
    var pr = G.PATHS[i];
    var grade = pr[5] === 'S' ? 'S' : released ? 'A' : pr[5] ? 'B' : 'C';
    return { name: pr[1] + (released ? ' \u00b7 \u89e3 Released' : ''), kanji: pr[0], accent: pr[6], signIdx: i, hard: !!pr[5], grade: grade, released: !!released,
      steps: pr[4].map(function (s) { var m = G.deep(s); m.id = uid('m'); if (m.breath) { m.secs = (m.breath[0] + m.breath[1] + m.breath[2] + m.breath[3]) * m.breath[4]; } return m; }) };
  };
  G.pathTime = function (i) {
    var w = 0, f = 0;
    G.PATHS[i][4].forEach(function (s) {
      var sec = s.secs > 0 ? s.secs : (s.type === 'reps' ? 45 : 20);
      if (sec >= 600) f += sec; else w += sec * (s.sides ? 2 : 1);
    });
    return '~' + Math.max(1, Math.round(w / 60)) + ' min' + (f ? ' + ' + Math.round(f / 60) + 'm focus' : '');
  };
  G.pathSign = function (i, cls) { return '<svg viewBox="0 0 24 24" class="' + (cls || '') + '">' + G.SIGNS[i] + '</svg>'; };
  G.pathMastery = function (kanji) {
    var n = 0, log = G.state.log;
    Object.keys(log).forEach(function (k) { Object.keys(log[k]).forEach(function (p) { if (log[k][p].sealed && log[k][p].sigil === kanji) n++; }); });
    return n;
  };
  G.masteryTier = function (n) { return n >= 30 ? 2 : n >= 7 ? 1 : 0; };
  G.pathsSealed = function () { var seen = {}; G.PATHS.forEach(function (pr) { if (G.pathMastery(pr[0])) seen[pr[0]] = 1; }); return Object.keys(seen).length; };

  /* ---------- a scroll, measured ---------- */
  G.scrollStats = function (pid) {
    var p = G.state.protocols[pid]; if (!p) return { steps: 0, secs: 0, chakra: 0, mins: 0 };
    var steps = 0, secs = 0, chakra = 0;
    (p.movements || []).forEach(function (m) {
      if (m.type === 'section') return;
      steps++;
      if (m.type === 'path') { secs += 480; chakra += 24; return; }
      var sec = m.secs > 0 ? m.secs : (m.type === 'reps' ? Math.max(20, (m.reps || 10) * 2.5) : 18);
      secs += sec * (m.sides ? 2 : 1);
      chakra += G.stepChakra ? G.stepChakra(m, false) : 2;
    });
    return { steps: steps, secs: Math.round(secs), mins: Math.max(1, Math.round(secs / 60)), chakra: chakra };
  };
  /* move a step to another scroll; duplicate a whole scroll */
  G.moveStep = function (fromPid, idx, toPid) {
    var a = G.state.protocols[fromPid], b = G.state.protocols[toPid];
    if (!a || !b || !a.movements[idx]) return false;
    var m = a.movements.splice(idx, 1)[0]; m.id = uid('m'); b.movements.push(m); G.save(); return true;
  };
  G.duplicateScroll = function (pid) {
    var p = G.state.protocols[pid]; if (!p) return null;
    var np = G.deep(p), id = uid('p');
    np.id = id; np.builtin = false; np.name = (p.name + ' copy').slice(0, 30);
    np.movements.forEach(function (m) { m.id = uid('m'); });
    G.state.protocols[id] = np; G.save(); return id;
  };

  /* ---------- undo: a shallow stack of protocol snapshots ---------- */
  var undoStack = [];
  G.snapshot = function (pid, label) {
    var p = G.state.protocols[pid]; if (!p) return;
    undoStack.push({ pid: pid, label: label || 'that change', data: JSON.stringify(p) });
    if (undoStack.length > 12) undoStack.shift();
  };
  G.canUndo = function () { return undoStack.length > 0; };
  G.undoLabel = function () { return undoStack.length ? undoStack[undoStack.length - 1].label : ''; };
  G.undo = function () {
    var u = undoStack.pop(); if (!u) return null;
    try { G.state.protocols[u.pid] = JSON.parse(u.data); G.save(); return u.pid; } catch (e) { return null; }
  };
  G.clearUndo = function () { undoStack = []; };

  /* ---------- day entries ---------- */
  G.entry = function (pid, key, create) {
    var log = G.state.log;
    if (!log[key]) { if (!create) return null; log[key] = {}; }
    if (!log[key][pid]) { if (!create) return null; log[key][pid] = { done: [], skip: [], sealed: false }; }
    return log[key][pid];
  };
  G.stepToday = function (m) { return !m.days || m.days.indexOf(G.dow()) >= 0; };
  G.daySeals = function (key) {
    var d = G.state.log[key] || {};
    return Object.keys(d).filter(function (p) { return d[p].sealed; }).map(function (p) { return { pid: p, sigil: d[p].sigil || null, rank: d[p].rank || null, chakra: d[p].chakra | 0, ryo: d[p].ryo | 0 }; });
  };
  G.dayLogs = function (key) {
    var d = G.state.log[key] || {}, out = [];
    Object.keys(d).forEach(function (p) { var lg = d[p].logs || {}; Object.keys(lg).forEach(function (n) { out.push({ pid: p, name: n, value: lg[n] }); }); });
    return out;
  };
  G.logTotal = function (name) {
    var t = 0, log = G.state.log;
    Object.keys(log).forEach(function (k) { Object.keys(log[k]).forEach(function (p) { var v = (log[k][p].logs || {})[name]; if (typeof v === 'number') t += v; }); });
    return Math.round(t * 10) / 10;
  };
  G.setDayLog = function (key, pid, name, val) {
    var e = G.entry(pid, key, true); e.logs = e.logs || {};
    if (val == null) delete e.logs[name]; else e.logs[name] = val;
    G.save();
  };
  G.todayProgress = function () {
    var total = 0, done = 0;
    ['asageiko', 'fuin'].forEach(function (pid) {
      var p = G.state.protocols[pid]; if (!p) return;
      var mv = p.movements.filter(function (m) { return G.stepToday(m) && m.type !== 'path'; });
      total += mv.length;
      var e = G.entry(pid, G.today(), false);
      if (e) { if (e.sealed) done += mv.length; else done += mv.filter(function (m) { return e.done.indexOf(m.id) >= 0; }).length; }
    });
    return { done: done, total: total, pct: total ? done / total : 0 };
  };
  G.weekKeysDisplay = function (key) {
    /* the week as the person sees it (their chosen start day); internal S-rank weeks stay Monday-anchored */
    if ((G.state.prefs || {}).weekStart !== 'sun') return G.weekKeys(key);
    key = key || G.today(); var p = key.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() - d.getDay());
    var out = []; for (var i = 0; i < 7; i++) { out.push(G.key(d)); d.setDate(d.getDate() + 1); }
    return out;
  };
  G.weekKeys = function (key) {
    /* Monday → Sunday containing key */
    var p = (key || G.today()).split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]);
    var wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd);
    var out = []; for (var i = 0; i < 7; i++) { out.push(G.key(d)); d.setDate(d.getDate() + 1); }
    return out;
  };

  /* ---------- run engine ---------- */
  G.startRun = function (pid, path) {
    G.entry(pid, G.today(), true);
    G.state.run = { pid: pid, key: G.today(), idx: -1, startAt: G.now(), chakra: 0,
      pathSteps: path ? path.steps : null, pathName: path ? path.name : null, pathKanji: path ? path.kanji : null, pathHard: !!(path && path.hard), pathGrade: path ? (path.grade || (path.hard ? 'B' : 'C')) : null,
      pathAccent: path ? (path.accent || '#d4b068') : null, pathSignIdx: (path && typeof path.signIdx === 'number') ? path.signIdx : null };
    G.save();
  };
  G.abandonRun = function () { G.state.run = null; G.save(); };
  /* ---------- the timer engine: wall-clock, persisted, survives the pocket ----------
     run.timer = { id, total, status: 'idle'|'running'|'paused', endAt, left, side2 }
     `left` is only authoritative while paused; while running the truth is endAt - now. */
  G.timerTotal = function (m) { var t = +(m && m.secs); if (!isFinite(t) || t <= 0) t = 60; return Math.round(t); };
  G.timerGet = function (m) {
    var r = G.state.run; if (!r || !m) return null;
    var t = r.timer;
    if (!t || t.id !== m.id) { t = r.timer = { id: m.id, total: G.timerTotal(m), status: 'idle', endAt: 0, left: G.timerTotal(m), side2: false }; }
    return t;
  };
  G.timerLeft = function (m) {
    var t = G.timerGet(m); if (!t) return 0;
    if (t.status === 'running') return Math.max(0, Math.ceil((t.endAt - G.now()) / 1000));
    return Math.max(0, t.left | 0);
  };
  G.timerStart = function (m) {
    var t = G.timerGet(m); if (!t) return null;
    if (t.status === 'running') return t;
    var left = t.status === 'paused' ? Math.max(1, t.left | 0) : t.total;
    t.endAt = G.now() + left * 1000; t.status = 'running'; G.save(); return t;
  };
  G.timerPause = function (m) {
    var t = G.timerGet(m); if (!t || t.status !== 'running') return t;
    t.left = G.timerLeft(m); t.status = 'paused'; t.endAt = 0; G.save(); return t;
  };
  G.timerReset = function (m) {
    var t = G.timerGet(m); if (!t) return null;
    t.status = 'idle'; t.endAt = 0; t.left = t.total; t.side2 = false; G.save(); return t;
  };
  /* called every tick by the UI; returns 'flip' when a two-sided step rolls to side 2, 'done' when the clock hits zero */
  G.timerTick = function (m) {
    var t = G.timerGet(m); if (!t || t.status !== 'running') return null;
    if (G.timerLeft(m) > 0) return null;
    if (m.sides && !t.side2) { t.side2 = true; t.endAt = G.now() + t.total * 1000; G.save(); return 'flip'; }
    t.status = 'idle'; t.endAt = 0; t.left = 0; G.save(); return 'done';
  };
  G.timerClear = function () { var r = G.state.run; if (r && r.timer) { r.timer = null; G.save(); } };

  G.runMv = function () {
    var r = G.state.run; if (!r) return [];
    var base = (G.state.protocols[r.pid] || {}).movements || [];
    var out = [];
    base.forEach(function (m) {
      if (m.type === 'section') return;
      if (!G.stepToday(m)) return;
      if (m.type === 'path') { if (r.pathSteps) r.pathSteps.forEach(function (pm) { if (pm.type !== 'section' && G.stepToday(pm)) out.push(pm); }); return; }
      out.push(m);
    });
    return out;
  };
  G.current = function () {
    var r = G.state.run; if (!r) return null;
    var mv = G.runMv(), e = G.entry(r.pid, r.key, true);
    return { run: r, mv: mv, e: e, p: G.state.protocols[r.pid] };
  };
  function settled(e, id) { return e.done.indexOf(id) >= 0 || e.skip.indexOf(id) >= 0; }
  G.nextIdx = function () {
    var c = G.current(); if (!c) return -1;
    for (var i = 0; i < c.mv.length; i++) if (!settled(c.e, c.mv[i].id)) return i;
    return -1;
  };
  G.inPath = function (m) { var r = G.state.run; return !!(r && r.pathSteps && r.pathSteps.indexOf(m) >= 0); };
  G.completeAt = function (i) {
    var c = G.current(); if (!c) return null;
    var m = c.mv[i]; if (!m) return null;
    var si = c.e.skip.indexOf(m.id); if (si >= 0) c.e.skip.splice(si, 1);
    var gained = 0;
    if (c.e.done.indexOf(m.id) < 0) {
      c.e.done.push(m.id);
      gained = G.stepChakra(m, G.inPath(m));
      G.state.run.chakra = (G.state.run.chakra | 0) + gained;
    }
    if (G.state.run.timer && G.state.run.timer.id === m.id) G.state.run.timer = null;
    G.state.run.idx = G.nextIdx(); G.save();
    return { done: true, next: G.state.run.idx, chakra: gained };
  };
  G.uncompleteAt = function (i) {
    var c = G.current(); if (!c) return;
    var m = c.mv[i], di = c.e.done.indexOf(m.id);
    if (di >= 0) { c.e.done.splice(di, 1); G.state.run.chakra = Math.max(0, (G.state.run.chakra | 0) - G.stepChakra(m, G.inPath(m))); }
    G.state.run.idx = G.nextIdx(); G.save();
  };
  G.skipAt = function (i) {
    var c = G.current(); if (!c) return;
    var m = c.mv[i];
    if (c.e.done.indexOf(m.id) < 0 && c.e.skip.indexOf(m.id) < 0) c.e.skip.push(m.id);
    if (G.state.run.timer && G.state.run.timer.id === m.id) G.state.run.timer = null;
    G.state.run.idx = G.nextIdx(); G.save();
  };
  G.unskipAt = function (i) {
    var c = G.current(); if (!c) return;
    var si = c.e.skip.indexOf(c.mv[i].id); if (si >= 0) c.e.skip.splice(si, 1);
    G.state.run.idx = G.nextIdx(); G.save();
  };
  G.allSettled = function () {
    var c = G.current(); if (!c || !c.mv.length) return false;
    return c.mv.every(function (m) { return settled(c.e, m.id); });
  };
  G.runLog = function (name, val) {
    var r = G.state.run; if (!r) return;
    var e = G.entry(r.pid, r.key, true);
    e.logs = e.logs || {}; e.logs[name] = val;
    if (G.senseiPerk('logChakra')) { G.state.run.chakra = (G.state.run.chakra | 0) + 5; }
    G.save();
  };
  /* sealDay lives in game.js — it is where the rewards are. */

  /* ---------- pouch ---------- */
  G.dogu = function (id) { return G.state.dogu.items[id] || null; };
  G.doguIds = function () { return Object.keys(G.state.dogu.items); };
  G.doguBuy = function (d) { if (d.url) return d.url; return 'https://www.amazon.com/s?k=' + encodeURIComponent(d.name || d.slot); };
  G.doguEnsure = function (slot, cat) {
    var want = slot.trim().toLowerCase(), hit = null;
    G.doguIds().forEach(function (id) { if (!hit && G.dogu(id).slot.trim().toLowerCase() === want) hit = id; });
    if (hit) return hit;
    var id = uid('g');
    G.state.dogu.items[id] = { slot: slot, cat: cat || 'gear', name: '', price: 0, url: '', owned: false };
    G.save(); return id;
  };
  G.doguShelf = function (cat) {
    var claimed = {};
    G.doguIds().forEach(function (id) { claimed[G.dogu(id).slot.toLowerCase()] = 1; });
    return (G.SHELF[cat] || []).filter(function (s) { return !claimed[s.toLowerCase()]; });
  };
  G.doguRefs = function (id) {
    var n = 0;
    Object.keys(G.state.protocols).forEach(function (p) { (G.state.protocols[p].movements || []).forEach(function (m) { if (m.dogu === id) n++; }); });
    return n;
  };
  G.kitComplete = function () { return G.KIT.every(function (k) { var d = G.dogu(k[0]); return !d || d.owned; }); };

  /* ---------- path sharing (format unchanged — v1 codes still work) ---------- */
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))); }
  function b64d(s) { return decodeURIComponent(escape(atob(s))); }
  G.exportPath = function (pid) {
    var p = G.state.protocols[pid];
    var payload = { v: 1, n: p.name.slice(0, 30), k: p.kanji.slice(0, 2), e: (p.en || '').slice(0, 40), s: p.schedule,
      m: p.movements.map(function (m) {
        var o = { n: m.name.slice(0, 80), t: m.type === 'path' ? 'open' : m.type, s: m.secs | 0, r: m.reps | 0 };
        if (m.cue) o.c = m.cue.slice(0, 300);
        if (m.sides) o.sd = 1;
        if (m.days) o.d = m.days;
        if (m.log) o.l = m.log.slice(0, 8);
        if (m.breath) o.b = m.breath;
        if (m.ref && m.ref.url) o.u = String(m.ref.url).slice(0, 300);
        return o;
      }) };
    if (p.hard) payload.h = 1;
    G.state.bounties.__shared = 1; G.save();
    return TAG + b64e(JSON.stringify(payload)) + ':';
  };
  G.importPath = function (txt) {
    var i = String(txt || '').indexOf(TAG);
    if (i < 0) throw new Error('No path code found — it starts with ' + TAG);
    var tail = txt.slice(i + TAG.length).replace(/\s+/g, '');
    var j = tail.indexOf(':');
    var raw = (j >= 0 ? tail.slice(0, j) : tail).replace(/[^A-Za-z0-9+\/=]/g, '');
    var o;
    try { o = JSON.parse(b64d(raw)); } catch (e) { throw new Error('That path code is damaged'); }
    if (!o || o.v !== 1 || !Array.isArray(o.m)) throw new Error('That path code is damaged');
    var pid = G.newScroll('path');
    var p = G.state.protocols[pid];
    p.name = String(o.n || 'Received Path').slice(0, 30);
    p.kanji = String(o.k || '道').slice(0, 2);
    p.en = String(o.e || '').slice(0, 40);
    p.schedule = ['am', 'pm', 'any'].indexOf(o.s) >= 0 ? o.s : 'any';
    p.hard = !!o.h;
    p.movements = o.m.slice(0, 60).map(function (m) {
      var step = { id: uid('m'), name: String(m.n || 'Step').slice(0, 80), cue: String(m.c || '').slice(0, 300),
        type: (m.t === 'timed' || m.t === 'reps' || m.t === 'breath') ? m.t : 'open',
        secs: G.clamp(m.s | 0, 0, 7200), reps: G.clamp(m.r | 0, 1, 500) };
      if (m.sd) step.sides = 1;
      if (m.u && /^https?:\/\//.test(m.u)) step.ref = { url: String(m.u).slice(0, 300), note: '' };
      if (Array.isArray(m.d) && m.d.length && m.d.length < 7) step.days = m.d.map(Number).filter(function (x) { return x >= 0 && x <= 6; });
      if (typeof m.l === 'string' && m.l) step.log = m.l.slice(0, 8);
      if (step.type === 'breath') step.breath = Array.isArray(m.b) ? m.b.map(Number) : [4, 4, 4, 4, 4];
      return step;
    });
    G.save(); return pid;
  };
})((typeof window !== 'undefined' ? window : global).HOKAGE = (typeof window !== 'undefined' ? window : global).HOKAGE || {});
