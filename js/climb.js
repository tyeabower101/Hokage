/* HOKAGE — climb: the six trials, the Kage campaign, specializations, masks, summons, demotion, the Bazaar's deeds. No DOM. */
(function (G) {
  'use strict';

  /* ---------- state shape ---------- */
  G.climbFresh = function () {
    return { trial: null, cooldown: {}, spec: [], masks: { chosen: '', burned: [], worn: '' }, kage: { arcs: {}, carved: false, retired: 0 },
      promotedAt: {}, fails: {}, shadow: false, history: [], weakest: null };
  };
  G.summonsFresh = function () { return { owned: [], active: '', grown: {} }; };
  G.ensureClimb = function (st) {
    st = st || G.state;
    if (!st.climb || typeof st.climb !== 'object') st.climb = G.climbFresh();
    var c = st.climb, f = G.climbFresh();
    Object.keys(f).forEach(function (k) { if (c[k] === undefined || c[k] === null) c[k] = f[k]; });
    if (!Array.isArray(c.spec)) c.spec = [];
    if (!Array.isArray(c.history)) c.history = [];
    if (!c.masks.burned) c.masks.burned = [];
    if (!c.kage.arcs) c.kage.arcs = {};
    if (!st.summons || typeof st.summons !== 'object') st.summons = G.summonsFresh();
    if (!Array.isArray(st.summons.owned)) st.summons.owned = [];
    if (!st.summons.grown) st.summons.grown = {};
    if (!st.cosmetics.cloak) st.cosmetics.cloak = ''; if (!st.cosmetics.mask) st.cosmetics.mask = '';
    if (!st.cosmetics.weapon) st.cosmetics.weapon = ''; if (!st.cosmetics.ink) st.cosmetics.ink = ''; if (!st.cosmetics.scene) st.cosmetics.scene = '';
    if (!st.bestStreak) st.bestStreak = 0;
    if (!c.promotedAt[st.rankIdx]) c.promotedAt[st.rankIdx] = st.created || G.today();
    return c;
  };

  /* ---------- record helpers ---------- */
  G.bothBases = function (k) { var d = G.state.log[k] || {}; return !!(d.asageiko && d.asageiko.sealed && d.fuin && d.fuin.sealed); };
  G.dayPathSigil = function (k) {
    var d = G.state.log[k] || {}, out = null;
    Object.keys(d).forEach(function (p) { var e = d[p]; if (e.sealed && e.sigil && e.sigil !== (G.state.protocols[p] || {}).kanji) out = out || { sigil: e.sigil, hard: e.rank === 'B' || e.rank === 'A' }; });
    return out;
  };
  G.dayHardPath = function (k) { var s = G.dayPathSigil(k); return !!(s && s.hard); };
  G.bestStreakEver = function () {
    var keys = Object.keys(G.state.log).filter(G.dayCovered).sort(), best = 0, run = 0, prev = null;
    keys.forEach(function (k) { run = (prev && G.addDays(prev, 1) === k) ? run + 1 : 1; best = Math.max(best, run); prev = k; });
    G.state.bestStreak = Math.max(G.state.bestStreak | 0, best, G.streak());
    return G.state.bestStreak;
  };
  G.masteredCount = function (hardOnly) {
    var n = 0; G.PATHS.forEach(function (pr) { if (hardOnly && !pr[5]) return; if (G.pathMastery(pr[0]) >= 7) n++; }); return n;
  };
  G.distinctPathsIn = function (keys) { var s = {}; keys.forEach(function (k) { var p = G.dayPathSigil(k); if (p) s[p.sigil] = 1; }); return Object.keys(s).length; };
  G.perfectWeeksIn = function (keys) {
    var w = {}; keys.forEach(function (k) { var wk = G.weekKeys(k); if (wk.every(G.daySealed)) w[wk[0]] = 1; }); return Object.keys(w).length;
  };
  G.baseSealCount = function (pid, since) {
    var n = 0, log = G.state.log; Object.keys(log).forEach(function (k) { if ((!since || k >= since) && log[k][pid] && log[k][pid].sealed) n++; }); return n;
  };
  G.windowKeys = function (start, days) { var out = [], k = start; for (var i = 0; i < days; i++) { out.push(k); k = G.addDays(k, 1); } return out; };
  G.daysSince = function (k) { return Math.round((new Date(G.today()) - new Date(k)) / 864e5); };

  /* the weakest step: the base-scroll step skipped most in the last 30 days */
  G.weakestStep = function () {
    var skips = {}, names = {}, k = G.today();
    for (var i = 0; i < 30; i++) {
      var d = G.state.log[k] || {};
      ['asageiko', 'fuin'].forEach(function (pid) { var e = d[pid]; if (e) (e.skip || []).forEach(function (id) { skips[pid + ':' + id] = (skips[pid + ':' + id] || 0) + 1; }); });
      k = G.addDays(k, -1);
    }
    var best = null, bn = 0;
    ['asageiko', 'fuin'].forEach(function (pid) { (G.state.protocols[pid].movements || []).forEach(function (m) { if (m.type === 'path' || m.days) return; names[pid + ':' + m.id] = { pid: pid, id: m.id, name: m.name }; var n = skips[pid + ':' + m.id] || 0; if (n > bn || (!best && !bn)) { best = names[pid + ':' + m.id]; bn = n; } }); });
    if (!best) return null;
    if (!bn) { /* nothing skipped: the longest step is the enemy */
      var longest = null, ls = -1;
      ['asageiko', 'fuin'].forEach(function (pid) { (G.state.protocols[pid].movements || []).forEach(function (m) { if (m.type === 'path' || m.days) return; var s = m.secs || (m.type === 'reps' ? 60 : 15); if (s > ls) { ls = s; longest = { pid: pid, id: m.id, name: m.name }; } }); });
      best = longest || best;
    }
    return { pid: best.pid, id: best.id, name: best.name, skips: bn };
  };
  G.stepDoneOn = function (k, pid, id) { var e = (G.state.log[k] || {})[pid]; return !!(e && e.sealed && e.done.indexOf(id) >= 0); };

  /* ---------- the six trials ---------- */
  /* each trial: id, rankIdx earned, kanji, name, arc text, eligible(), start(), status() → {pct, lines[], passed, failed, over}, cooldownDays */
  G.TRIALS = [null,
    { id: 'bell', kanji: '鈴', name: 'The Bell Test', days: 7, cd: 3, voice: 'Kakashi',
      intro: 'Two bells. Wake Up is one, Wind Down is the other. Seal three days of seven — and on at least one of them, take both bells.',
      fail: 'You went hungry. The bells hang on the post until you come back.', pass: 'You are the first ones who ever got a bell from me.' },
    { id: 'forest', kanji: '森', name: 'The Forest of Death', days: 5, cd: 14, voice: 'Anko',
      intro: 'Five days in the forest. You carry two scrolls — Heaven and Earth. Every day must be sealed with a path. Both scrolls must reach the tower. Substitution does not work in here. One miss and the forest has you. Then the Preliminaries: one opponent, three days.',
      fail: 'The forest took you. It reopens in fourteen days — if you still want the tower.', pass: 'You reached the tower. Now, one opponent.' },
    { id: 'spec', kanji: '特', name: 'The Specialization', days: 0, cd: 0, voice: 'the Academy',
      intro: 'Not a streak. A discipline. Declare Taijutsu, Genjutsu or Medical — then master a path in that track ten times, five of them at 極, and grow the matching base scroll to eight real steps sealed fourteen times.',
      fail: '', pass: 'The village trusts you alone with one thing.' },
    { id: 'jonin', kanji: '上', name: 'The Trial of the Three', days: 14, cd: 10, voice: 'the Third',
      intro: 'A Jōnin is complete. Fourteen days, all fourteen sealed, both bases every day, a path every day — and never the same path two days running. Your scrolls must carry all three disciplines.',
      fail: 'Fourteen is fourteen. The trial reopens in ten days.', pass: 'The flak vest is yours.' },
    { id: 'anbu', kanji: '暗', name: 'Selection', days: 7, cd: 21, voice: 'Root',
      intro: 'Choose a mask. You do not get to wear it yet. Then seven days in the dark: no chakra, no ryō, no streak, no record — only the seal and the candle. Both bases every day. Three 極 paths in the week. You will not know how you did until it is over.',
      fail: 'The mask burns. It is gone. Twenty-one days, then choose another.', pass: 'You have seen too much to go back. The mask is yours.' },
    { id: 'kage', kanji: '影', name: 'The Five Kage Summit', days: 0, cd: 30, voice: 'the village',
      intro: 'Four arcs. Pain’s Assault — fourteen days to rebuild a crater. Sage Training — thirty unbroken days on the mountain. The War — twenty-eight days, five fronts. The Summit — seven days against the other four Kage and Madara. Nobody in this village has ever finished it.',
      fail: 'The hat sits on an empty chair. Thirty days.', pass: 'The rock is carved.' }
  ];
  G.TRACKS = { tai: { kanji: '体', name: 'Taijutsu', paths: [0, 1, 3, 5], base: 'asageiko', sub: 'reps, gates, the body at dawn' }, gen: { kanji: '幻', name: 'Genjutsu', paths: [2, 6, 8], base: 'fuin', sub: 'breath, release, the quiet mind' }, med: { kanji: '医', name: 'Medical', paths: [7, 9], base: 'fuin', sub: 'skin, scalp, the vessel conditioned' } };
  G.MASKS = [['cat', '猫', 'Cat', '#e9e3d6'], ['hawk', '鷹', 'Hawk', '#d8b56a'], ['boar', '猪', 'Boar', '#c98a6a'], ['bear', '熊', 'Bear', '#9aa7b8'], ['wolf', '狼', 'Wolf', '#b9c7d8'], ['monkey', '猿', 'Monkey', '#e0b393']];
  G.KAGE_ARCS = [
    { id: 'pain', kanji: '痛', name: 'Pain’s Assault', days: 14, need: 12, voice: 'Pain', line: 'Know pain. Fourteen days, both scrolls, and the village rebuilds one roof at a time.' },
    { id: 'sage', kanji: '仙', name: 'Sage Training', days: 0, need: 30, voice: 'Fukasaku', line: 'You are moving. Stop moving. Thirty days unbroken, or the oil burns you.' },
    { id: 'war', kanji: '戦', name: 'The War', days: 28, need: 26, voice: 'Shikaku', line: 'Five fronts. Twenty-six of twenty-eight. Every division has to hold.' },
    { id: 'summit', kanji: '頂', name: 'The Summit', days: 7, need: 7, voice: 'Madara', line: 'Seven days. Both scrolls. A 極 path each day. No substitutions. Then me.' }
  ];
  G.SUMMIT_DAYS = [['雷', 'Raikage', 'a reps-heavy path'], ['水', 'Mizukage', 'a breath path'], ['土', 'Tsuchikage', 'the longest timed path'], ['風', 'Kazekage', 'your weakest step, done'], ['斑', 'Madara', 'the full scroll and a 極 path'], ['斑', 'Madara', 'the full scroll and a 極 path'], ['斑', 'Madara', 'everything. no mercy.']];

  function within(keys) { return keys.filter(function (k) { return k <= G.today(); }); }

  /* eligibility for the next trial */
  G.trialEligible = function () {
    var st = G.state, c = G.ensureClimb(), idx = st.rankIdx + 1, T = G.TRIALS[idx]; if (!T) return { ok: false, why: 'the summit' };
    if (c.trial) return { ok: false, why: 'in progress' };
    var cd = c.cooldown[T.id]; if (cd && cd > G.today()) return { ok: false, why: 'cooldown', until: cd, left: -G.daysSince(cd) };
    var need = [];
    if (T.id === 'bell') { if (st.missions < 1) need.push('seal one scroll first'); }
    if (T.id === 'forest') { if (G.bestStreakEver() < 5) need.push('a 5-day chain somewhere in your record'); }
    if (T.id === 'spec') { /* open */ }
    if (T.id === 'jonin') { if (G.bestStreakEver() < 14) need.push('a 14-day chain in your record'); if (!G.scrollsCoverTracks()) need.push('steps from all three disciplines in your base scrolls'); }
    if (T.id === 'anbu') {
      if (G.bestStreakEver() < 60) need.push('a 60-day chain in your record (' + G.bestStreakEver() + ')');
      if (G.masteredCount() < 3) need.push('three paths mastered (' + G.masteredCount() + ')');
      var at = c.promotedAt[4]; if (!at || G.daysSince(at) < 21) need.push('twenty-one days as Jōnin');
    }
    if (T.id === 'kage') { var at5 = c.promotedAt[5]; if (!at5 || G.daysSince(at5) < 30) need.push('thirty days in ANBU'); }
    return need.length ? { ok: false, why: 'needs', need: need } : { ok: true };
  };
  G.scrollsCoverTracks = function () {
    var has = { tai: 0, gen: 0, med: 0 };
    ['asageiko', 'fuin'].forEach(function (pid) { (G.state.protocols[pid].movements || []).forEach(function (m) {
      if (m.type === 'reps' || (m.type === 'timed' && m.secs >= 45)) has.tai = 1;
      if (m.type === 'breath' || /medit|breath|release|kai|still/i.test(m.name)) has.gen = 1;
      if (m.dogu || /skin|scalp|hair|wash|cleanse|floss|brush|adapalene|minoxidil|stamp|sunscreen|moist|teeth/i.test(m.name)) has.med = 1;
    }); });
    return has.tai && has.gen && has.med;
  };

  /* start the next trial (opt-in, always) */
  G.startTrial = function (opts) {
    var st = G.state, c = G.ensureClimb(), el = G.trialEligible(); if (!el.ok) return el;
    var idx = st.rankIdx + 1, T = G.TRIALS[idx]; opts = opts || {};
    var tr = { id: T.id, rankIdx: idx, start: G.today(), stage: 1 };
    if (T.id === 'spec') { if (!G.TRACKS[opts.track]) return { ok: false, why: 'choose a track' }; tr.track = opts.track; }
    if (T.id === 'anbu') { if (!G.MASKS.some(function (m) { return m[0] === opts.mask; }) || c.masks.burned.indexOf(opts.mask) >= 0) return { ok: false, why: 'choose a mask' }; tr.mask = opts.mask; c.masks.chosen = opts.mask; c.shadow = true; }
    if (T.id === 'kage') { tr.arc = 0; tr.arcStart = G.today(); tr.rebuilt = []; tr.scars = []; if (!c.kage.arcs.pain) {} }
    c.trial = tr; c.history.push({ id: T.id, at: G.today(), ev: 'start' });
    G.save(); return { ok: true, trial: tr };
  };
  G.withdrawTrial = function () {
    var c = G.ensureClimb(), tr = c.trial; if (!tr) return false;
    var T = G.TRIALS[tr.rankIdx];
    c.cooldown[T.id] = G.addDays(G.today(), 7); c.shadow = false; c.trial = null; c.history.push({ id: T.id, at: G.today(), ev: 'withdraw' });
    G.save(); return true;
  };

  /* ---------- status: the single truth about the running trial ---------- */
  G.trialStatus = function () {
    var st = G.state, c = G.ensureClimb(), tr = c.trial; if (!tr) return null;
    var T = G.TRIALS[tr.rankIdx], s = { id: tr.id, rankIdx: tr.rankIdx, def: T, stage: tr.stage, lines: [], pct: 0, passed: false, failed: false, over: false, keys: [], trial: tr };
    var today = G.today();
    if (tr.id === 'bell') {
      var ks = G.windowKeys(tr.start, 7), got = ks.filter(G.daySealed).length, both = ks.some(G.bothBases);
      s.keys = ks; s.got = got; s.need = 3; s.left = Math.max(0, 6 - G.daysSince(tr.start)); s.over = G.daysSince(tr.start) > 6;
      s.lines = [['Days sealed', got + ' / 3', got >= 3], ['Both bells in one day', both ? 'taken' : 'not yet', both]];
      s.passed = got >= 3 && both; s.failed = s.over && !s.passed; s.pct = Math.min(1, (got / 3) * 0.7 + (both ? 0.3 : 0));
    }
    if (tr.id === 'forest') {
      if (tr.stage === 1) {
        var fk = G.windowKeys(tr.start, 5), past = within(fk).filter(function (k) { return k < today; });
        var died = past.some(function (k) { return !G.daySealed(k) || !G.dayPathSigil(k); });
        var sealedN = fk.filter(function (k) { return G.daySealed(k) && G.dayPathSigil(k); }).length;
        var heaven = fk.some(function (k) { var e = (st.log[k] || {}).asageiko; return e && e.sealed; }), earth = fk.some(function (k) { var e = (st.log[k] || {}).fuin; return e && e.sealed; });
        s.keys = fk; s.got = sealedN; s.need = 5; s.left = Math.max(0, 4 - G.daysSince(tr.start)); s.over = G.daysSince(tr.start) > 4;
        s.lines = [['Days survived (path sealed)', sealedN + ' / 5', sealedN >= 5], ['天 Heaven scroll (Wake Up)', heaven ? 'carried' : 'missing', heaven], ['地 Earth scroll (Wind Down)', earth ? 'carried' : 'missing', earth]];
        s.failed = died || (s.over && !(sealedN >= 5 && heaven && earth));
        s.stageDone = !died && sealedN >= 5 && heaven && earth; s.pct = sealedN / 5 * 0.5;
      } else {
        var w = tr.weakest, streakN = 0, k = today;
        if (!G.stepDoneOn(k, w.pid, w.id)) k = G.addDays(k, -1);
        while (G.stepDoneOn(k, w.pid, w.id) && k >= tr.prelimStart && streakN < 3) { streakN++; k = G.addDays(k, -1); }
        var pk = G.windowKeys(tr.prelimStart, 7); s.keys = pk; s.left = Math.max(0, 6 - G.daysSince(tr.prelimStart)); s.over = G.daysSince(tr.prelimStart) > 6;
        s.lines = [['Opponent', w.name, false], ['Three days running', streakN + ' / 3', streakN >= 3]];
        s.got = streakN; s.need = 3; s.passed = streakN >= 3; s.failed = s.over && !s.passed; s.pct = 0.5 + streakN / 6;
      }
    }
    if (tr.id === 'spec') {
      var tk = G.TRACKS[tr.track], best = null, bm = 0, bh = 0;
      tk.paths.forEach(function (i) { var pr = G.PATHS[i], m = G.pathMastery(pr[0]), h = 0; Object.keys(st.log).forEach(function (kk) { Object.keys(st.log[kk]).forEach(function (p) { var e = st.log[kk][p]; if (e.sealed && e.sigil === pr[0] && (e.rank === 'B' || e.rank === 'A')) h++; }); }); if (m > bm) { bm = m; bh = h; best = pr[1]; } });
      var steps = (st.protocols[tk.base].movements || []).filter(function (m) { return m.type !== 'path'; }).length, seals = G.baseSealCount(tk.base, tr.start);
      s.lines = [['Path in ' + tk.name + ' mastered ×10', bm + ' / 10' + (best ? ' · ' + best.split(' — ')[0] : ''), bm >= 10], ['…five of them at 極', Math.min(bh, 5) + ' / 5', bh >= 5], [(tk.base === 'asageiko' ? 'Wake Up' : 'Wind Down') + ' ≥ 8 steps', steps + ' / 8', steps >= 8], ['…sealed 14× since declaring', seals + ' / 14', seals >= 14]];
      s.passed = bm >= 10 && bh >= 5 && steps >= 8 && seals >= 14; s.pct = (Math.min(1, bm / 10) + Math.min(1, bh / 5) + Math.min(1, steps / 8) + Math.min(1, seals / 14)) / 4; s.track = tk;
    }
    if (tr.id === 'jonin') {
      var jk = G.windowKeys(tr.start, 14), jp = within(jk).filter(function (k) { return k < today; });
      var okDay = function (k) { return G.daySealed(k) && G.bothBases(k) && !!G.dayPathSigil(k); };
      var sealedJ = jk.filter(okDay).length, broke = jp.some(function (k) { return !okDay(k); });
      var repeat = false; for (var i = 1; i < jk.length; i++) { var a = G.dayPathSigil(jk[i - 1]), b = G.dayPathSigil(jk[i]); if (a && b && a.sigil === b.sigil) repeat = true; }
      s.keys = jk; s.got = sealedJ; s.need = 14; s.left = Math.max(0, 13 - G.daysSince(tr.start)); s.over = G.daysSince(tr.start) > 13;
      s.lines = [['Days: both bases + a path', sealedJ + ' / 14', sealedJ >= 14], ['Never the same path twice running', repeat ? 'broken' : 'holding', !repeat]];
      s.failed = broke || repeat || (s.over && sealedJ < 14); s.passed = sealedJ >= 14 && !repeat; s.pct = sealedJ / 14;
    }
    if (tr.id === 'anbu') {
      var ak = G.windowKeys(tr.start, 7), ap = within(ak).filter(function (k) { return k < today; });
      var bothN = ak.filter(G.bothBases).length, hardN = ak.filter(G.dayHardPath).length, brokeA = ap.some(function (k) { return !G.bothBases(k); });
      s.keys = ak; s.got = bothN; s.need = 7; s.left = Math.max(0, 6 - G.daysSince(tr.start)); s.over = G.daysSince(tr.start) > 6;
      s.hidden = !s.over && !(bothN >= 7 && hardN >= 3);
      s.lines = [['Both bases, every day', bothN + ' / 7', bothN >= 7], ['極 paths this week', hardN + ' / 3', hardN >= 3]];
      s.failed = brokeA || (s.over && !(bothN >= 7 && hardN >= 3)); s.passed = bothN >= 7 && hardN >= 3 && !brokeA; s.pct = (bothN / 7) * 0.7 + Math.min(1, hardN / 3) * 0.3;
    }
    if (tr.id === 'kage') {
      var A = G.KAGE_ARCS[tr.arc]; s.arc = A; s.arcIdx = tr.arc;
      if (A.id === 'pain') {
        var pk2 = G.windowKeys(tr.arcStart, 14), reb = pk2.filter(G.bothBases).length, pp = within(pk2).filter(function (k) { return k < today; }), scars = pp.filter(function (k) { return !G.bothBases(k); }).length;
        s.keys = pk2; s.got = reb; s.need = 12; s.left = Math.max(0, 13 - G.daysSince(tr.arcStart)); s.over = G.daysSince(tr.arcStart) > 13;
        s.lines = [['Roofs rebuilt (both bases)', reb + ' / 12', reb >= 12], ['Scars', String(scars), scars <= 2]];
        s.stageDone = reb >= 12; s.failed = scars > 2; s.pct = reb / 12;
      }
      if (A.id === 'sage') {
        var sk = G.streak(); s.got = sk; s.need = 30; s.lines = [['Unbroken chain', sk + ' / 30', sk >= 30], ['Nature chakra', Math.round(Math.min(1, sk / 30) * 100) + '%', sk >= 30]];
        s.stageDone = sk >= 30; s.pct = Math.min(1, sk / 30); s.keys = [];
      }
      if (A.id === 'war') {
        var wk2 = G.windowKeys(tr.arcStart, 28), sealedW = wk2.filter(G.daySealed).length;
        var fronts = [['1st · six paths mastered', G.masteredCount(), 6], ['2nd · two 極 paths mastered', G.masteredCount(true), 2], ['3rd · both scrolls ≥ 12 steps', Math.min.apply(null, ['asageiko', 'fuin'].map(function (p) { return (st.protocols[p].movements || []).filter(function (m) { return m.type !== 'path'; }).length; })), 12], ['4th · perfect weeks in the war', G.perfectWeeksIn(wk2), 3], ['5th · distinct paths run', G.distinctPathsIn(wk2), 5]];
        s.fronts = fronts.map(function (f) { return { name: f[0], have: f[1], need: f[2], ok: f[1] >= f[2] }; });
        s.keys = wk2; s.got = sealedW; s.need = 26; s.left = Math.max(0, 27 - G.daysSince(tr.arcStart)); s.over = G.daysSince(tr.arcStart) > 27;
        s.lines = [['Days sealed', sealedW + ' / 26', sealedW >= 26]].concat(s.fronts.map(function (f) { return [f.name, f.have + ' / ' + f.need, f.ok]; }));
        var allF = s.fronts.every(function (f) { return f.ok; });
        s.stageDone = sealedW >= 26 && allF; s.failed = s.over && !s.stageDone; s.pct = (sealedW / 26 + s.fronts.filter(function (f) { return f.ok; }).length / 5) / 2;
      }
      if (A.id === 'summit') {
        var sm = G.windowKeys(tr.arcStart, 7), sp = within(sm).filter(function (k) { return k < today; });
        var okS = function (k, i) { if (!(G.daySealed(k) && G.bothBases(k) && G.dayHardPath(k))) return false; if (i === 3 && tr.weakest && !G.stepDoneOn(k, tr.weakest.pid, tr.weakest.id)) return false; return true; };
        var okN = sm.filter(okS).length, brokeS = sp.some(function (k) { return !okS(k, sm.indexOf(k)); });
        s.keys = sm; s.got = okN; s.need = 7; s.left = Math.max(0, 6 - G.daysSince(tr.arcStart)); s.over = G.daysSince(tr.arcStart) > 6; s.dayIdx = Math.min(6, Math.max(0, G.daysSince(tr.arcStart)));
        s.lines = sm.map(function (k, i) { var d = G.SUMMIT_DAYS[i]; return [d[0] + ' ' + d[1] + ' — ' + d[2], k > today ? '' : okS(k, i) ? 'won' : k === today ? 'today' : 'lost', okS(k, i)]; });
        s.failed = brokeS; s.passed = okN >= 7; s.pct = okN / 7;
      }
      if (!s.passed) s.passed = false;
    }
    return s;
  };

  /* ---------- advance: called on every seal and every dawn ---------- */
  G.climbTick = function (res) {
    var st = G.state, c = G.ensureClimb(), tr = c.trial; res = res || {}; res.climb = res.climb || [];
    if (!tr) { G.checkDemotion(res); G.checkSummons(res); return res; }
    var s = G.trialStatus(), T = G.TRIALS[tr.rankIdx];
    function fail(why) {
      c.cooldown[T.id] = G.addDays(G.today(), tr.id === 'kage' ? 30 : T.cd); c.fails[T.id] = (c.fails[T.id] | 0) + 1; c.shadow = false;
      if (tr.id === 'anbu') { c.masks.burned.push(tr.mask); c.masks.chosen = ''; }
      if (tr.id === 'kage') { /* keep arcs 1–3 */ c.kage.arcs.summitFail = (c.kage.arcs.summitFail | 0) + 1; }
      c.history.push({ id: T.id, at: G.today(), ev: 'fail' }); c.trial = null;
      var note = G.FAIL_NOTES && G.FAIL_NOTES[T.id]; if (note && !st.inbox.some(function (m) { return m.t === note.t; })) st.inbox.push(note);
      res.climb.push({ ev: 'fail', id: T.id, def: T, why: why, mask: tr.mask });
    }
    function pass() {
      c.shadow = false; c.history.push({ id: T.id, at: G.today(), ev: 'pass' }); c.trial = null;
      if (tr.id === 'spec') { if (c.spec.indexOf(tr.track) < 0) c.spec.push(tr.track); }
      if (tr.id === 'anbu') { c.masks.worn = tr.mask; st.cosmetics.mask = tr.mask; c.masks.chosen = ''; }
      if (tr.id === 'kage') { c.kage.carved = true; c.kage.arcs.summit = G.today(); }
      G._promote(res, tr.rankIdx); c.promotedAt[st.rankIdx] = G.today();
      res.climb.push({ ev: 'pass', id: T.id, def: T, mask: tr.mask });
    }
    if (s.failed) fail(s.over ? 'window' : 'broken');
    else if (tr.id === 'forest' && tr.stage === 1 && s.stageDone) { tr.stage = 2; tr.prelimStart = G.today(); tr.weakest = G.weakestStep(); res.climb.push({ ev: 'stage', id: 'forest', def: T, weakest: tr.weakest }); }
    else if (tr.id === 'kage' && s.stageDone && tr.arc < 3) {
      c.kage.arcs[G.KAGE_ARCS[tr.arc].id] = G.today(); tr.arc++; tr.arcStart = G.today();
      if (tr.arc === 3) tr.weakest = G.weakestStep();
      res.climb.push({ ev: 'arc', id: 'kage', def: T, arc: G.KAGE_ARCS[tr.arc], done: G.KAGE_ARCS[tr.arc - 1] });
    }
    else if (s.passed) pass();
    G.checkDemotion(res); G.checkSummons(res);
    G.save(); return res;
  };

  /* ---------- demotion: three silent weeks ---------- */
  G.checkDemotion = function (res) {
    var st = G.state, c = G.ensureClimb(); if (st.rankIdx <= 1) return;
    var last = G.lastSealedKey(); if (!last) return;
    var gap = G.daysSince(last); if (gap < 21) return;
    var floor = st.rankIdx >= 5 ? 4 : 1;
    if (st.rankIdx <= floor) return;
    var stamp = last; if (c.demotedFor === stamp) return;
    c.demotedFor = stamp;
    if (st.rankIdx === 6) { c.kage.retired++; }
    st.rankIdx--; c.promotedAt[st.rankIdx] = G.today();
    if (res) { res.climb = res.climb || []; res.climb.push({ ev: 'demote', to: G.rankInfo().name, retired: st.rankIdx === 5 }); }
    st.inbox.push({ k: '退', t: st.rankIdx === 5 ? 'The hat is set down' : 'The village marks your absence', b: st.rankIdx === 5 ? 'Twenty-one silent days. A Kage who is not in the village is not its Kage. The rock keeps your face; the chair is open. Re-run the Summit to take it back.' : 'Twenty-one days without a seal. The register lists you one rank lower. It is not a punishment. It is a fact. Seal a day.' });
  };

  /* ---------- summons: living contracts, unlocked by deeds, signed in blood ---------- */
  G.SUMMONS = [
    { id: 'toad', kanji: '蛙', name: 'Toad — Gamakichi', grown: 'Gamabunta', deed: 'a 30-day chain', price: 3000, color: '#e0823c', line: 'Sits on the cliff. Croaks on the seal. Smokes at night. Grows into the boss at 100 days.', check: function () { return G.bestStreakEver() >= 30; }, growAt: function () { return G.bestStreakEver() >= 100; } },
    { id: 'snake', kanji: '蛇', name: 'Snake — Manda’s line', grown: 'Manda', deed: 'fifteen 極 nights on the Serpent’s Lab or Madara', price: 4000, color: '#7fbf6a', line: 'Coils the card frame. The tongue flicks. The eyes follow the orb.', check: function () { return G.pathMastery('蛇') + G.pathMastery('覇') >= 15; }, growAt: function () { return G.pathMastery('蛇') + G.pathMastery('覇') >= 40; } },
    { id: 'slug', kanji: '蛞', name: 'Slug — Katsuyu', grown: 'Katsuyu, divided', deed: 'ten Substitutions spent', price: 3500, color: '#9fd8e8', line: 'You survived your misses. She splits across your week dots.', check: function () { return Object.keys(G.state.jutsu.used).length >= 10; }, growAt: function () { return Object.keys(G.state.jutsu.used).length >= 30; } },
    { id: 'hawk', kanji: '鷹', name: 'Hawk — Garuda', grown: 'Garuda, full wing', deed: 'fifty Wake Up seals before 7 AM', price: 4500, color: '#c9a25c', line: 'Circles the hero. Screeches at dawn.', check: function () { return G.earlySeals() >= 50; }, growAt: function () { return G.earlySeals() >= 150; } },
    { id: 'ninken', kanji: '犬', name: 'Ninken — Pakkun', grown: 'the eight ninken', deed: 'Kakashi as sensei and twenty paths run', price: 3000, color: '#bfa58a', line: 'A different dog on the card every day. Pakkun on Sundays.', check: function () { return G.senseiPerk('pathChakra') && G.pathsRunTotal() >= 20; }, growAt: function () { return G.pathsRunTotal() >= 80; } },
    { id: 'crow', kanji: '烏', name: 'Crow — Itachi’s flock', grown: 'the murder', deed: 'seven perfect weeks', price: 5000, color: '#6a6f85', line: 'Black feathers drift across every screen.', check: function () { return Object.keys(G.state.weeks).length >= 7; }, growAt: function () { return Object.keys(G.state.weeks).length >= 20; } },
    { id: 'kyubi', kanji: '九', name: 'Tailed Beast — the Nine-Tails', grown: 'the cloak, full', deed: 'the rank of Kage', price: 0, vault: true, color: '#ff7a2f', line: 'Chakra cloak on the crest. Permanent. Cannot be bought.', check: function () { return G.state.rankIdx >= 6; }, growAt: function () { return G.state.rankIdx >= 6 && G.bestStreakEver() >= 200; } }
  ];
  G.earlySeals = function () { var n = 0, log = G.state.log; Object.keys(log).forEach(function (k) { var e = log[k].asageiko; if (e && e.sealed && e.at && new Date(e.at).getHours() < 7) n++; }); return n; };
  G.pathsRunTotal = function () { var n = 0; G.PATHS.forEach(function (pr) { n += G.pathMastery(pr[0]); }); return n; };
  G.summonState = function (id) {
    var S = G.SUMMONS.filter(function (x) { return x.id === id; })[0], st = G.state;
    var owned = st.summons.owned.indexOf(id) >= 0, unlocked = !!S.check();
    return { def: S, owned: owned, unlocked: unlocked, grown: !!st.summons.grown[id], active: st.summons.active === id, canGrow: owned && !st.summons.grown[id] && S.growAt() };
  };
  G.checkSummons = function (res) {
    var st = G.state; G.ensureClimb();
    G.SUMMONS.forEach(function (S) {
      var ss = G.summonState(S.id);
      if (ss.unlocked && !st.summons['seen_' + S.id]) { st.summons['seen_' + S.id] = 1; if (res) { res.climb = res.climb || []; res.climb.push({ ev: 'summonUnlock', summon: S }); } }
      if (ss.canGrow) { st.summons.grown[S.id] = G.today(); if (res) { res.climb = res.climb || []; res.climb.push({ ev: 'summonGrow', summon: S }); } }
    });
  };
  G.signContract = function (id) {
    var ss = G.summonState(id), st = G.state; if (!ss.unlocked) return { ok: false, why: 'deed not done' };
    if (ss.owned) { st.summons.active = st.summons.active === id ? '' : id; G.save(); return { ok: true, toggled: true }; }
    if (!ss.def.vault && st.ryo < ss.def.price) return { ok: false, why: 'not enough ryō' };
    st.ryo -= ss.def.vault ? 0 : ss.def.price; st.summons.owned.push(id); st.summons.active = id; G.save(); return { ok: true, signed: true };
  };
  G.activeSummon = function () { var id = G.state.summons && G.state.summons.active; return id ? G.summonState(id) : null; };

  /* ---------- the Bazaar: stalls, deeds, collection ---------- */
  G.BAZAAR = [
    /* forge — weapons on the card */
    { id: 'w_kunai', stall: 'forge', kanji: '苦', name: 'Kunai set', sub: 'Three blades crossed behind the crest.', price: 600, kind: 'weapon', lvl: 3 },
    { id: 'w_kubikiri', stall: 'forge', kanji: '首', name: 'Kubikiribōchō', sub: 'Zabuza’s executioner blade, slung.', price: 2500, kind: 'weapon', lvl: 8 },
    { id: 'w_samehada', stall: 'forge', kanji: '鮫', name: 'Samehada', sub: 'The scales breathe. They move.', price: 5000, kind: 'weapon', lvl: 14, needsRank: 4 },
    { id: 'w_chidori', stall: 'forge', kanji: '雷', name: 'Chidori blade', sub: 'A thousand birds along the edge.', price: 7000, kind: 'weapon', lvl: 18, needsJutsu: 'chidori' },
    { id: 'w_susanoo', stall: 'forge', kanji: '須', name: 'Susanoo outline', sub: 'The ribcage of the giant, behind everything.', price: 12000, kind: 'weapon', lvl: 25, needsRank: 5, needsClan: 'uchiha' },
    /* tailor */
    { id: 'hb_blue', stall: 'tailor', kanji: '藍', name: 'Indigo headband', sub: 'The classic cloth.', price: 900, kind: 'headband', val: '#2f4f8a' },
    { id: 'hb_red', stall: 'tailor', kanji: '赤', name: 'Crimson headband', sub: 'Sand-style, blood-dyed.', price: 900, kind: 'headband', val: '#8a2f2f' },
    { id: 'hb_white', stall: 'tailor', kanji: '白', name: 'White headband', sub: 'Mist-style, unstained.', price: 1400, kind: 'headband', val: '#e8e4d8' },
    { id: 'hb_black', stall: 'tailor', kanji: '黒', name: 'Long black cloth', sub: 'Tied like the Fourth.', price: 2000, kind: 'headband', val: '#0a0b10', needsRank: 3 },
    { id: 'ck_akatsuki', stall: 'tailor', kanji: '暁', name: 'Akatsuki cloak', sub: 'Red clouds on black. The card wears it.', price: 4000, kind: 'cloak', val: 'akatsuki', needsRank: 5 },
    { id: 'ck_sage', stall: 'tailor', kanji: '仙', name: 'Sage cloak', sub: 'Red, with the flames at the hem.', price: 5000, kind: 'cloak', val: 'sage', needs: 'sage' },
    { id: 'ck_kage', stall: 'tailor', kanji: '影', name: 'The Kage’s haori', sub: 'White and red. Only one.', price: 0, kind: 'cloak', val: 'kage', vault: true, needsRank: 6 },
    /* ink shop — seal styles */
    { id: 'ink_blood', stall: 'ink', kanji: '血', name: 'Blood seal', sub: 'The stamp bleeds. Cells go crimson.', price: 1500, kind: 'ink', val: 'blood' },
    { id: 'ink_gold', stall: 'ink', kanji: '金', name: 'Gold leaf seal', sub: 'Flecks of leaf. Cells gild.', price: 3000, kind: 'ink', val: 'gold', needsRank: 2 },
    { id: 'ink_frost', stall: 'ink', kanji: '氷', name: 'Frost seal', sub: 'Haku’s ice, crystallizing in.', price: 3000, kind: 'ink', val: 'frost', needsRank: 2 },
    { id: 'ink_flame', stall: 'ink', kanji: '炎', name: 'Amaterasu seal', sub: 'Black flame that does not go out.', price: 6000, kind: 'ink', val: 'flame', needsRank: 4 },
    /* card frames */
    { id: 'fr_gold', stall: 'ink', kanji: '框', name: 'Gold leaf card', sub: 'The register, gilded.', price: 2400, kind: 'frame', val: 'gold' },
    { id: 'fr_crimson', stall: 'ink', kanji: '朱', name: 'Vermilion card', sub: 'Hanko-red border.', price: 2400, kind: 'frame', val: 'crimson' },
    { id: 'fr_sage', stall: 'ink', kanji: '草', name: 'Sage card', sub: 'Nature chakra in the ink.', price: 4500, kind: 'frame', val: 'sage', needs: 'sage' },
    /* scroll library — hero scenes */
    { id: 'sc_snow', stall: 'library', kanji: '雪', name: 'First snow', sub: 'The village under snowfall.', price: 2000, kind: 'scene', val: 'snow' },
    { id: 'sc_festival', stall: 'library', kanji: '祭', name: 'Festival night', sub: 'Lanterns strung roof to roof.', price: 3500, kind: 'scene', val: 'festival', needsRank: 2 },
    { id: 'sc_storm', stall: 'library', kanji: '嵐', name: 'The storm', sub: 'Lightning over the cliff.', price: 3500, kind: 'scene', val: 'storm', needsRank: 3 },
    { id: 'sc_rock', stall: 'library', kanji: '岩', name: 'Your face on the rock', sub: 'Carved. Cannot be bought.', price: 0, kind: 'scene', val: 'rock', vault: true, needsRank: 6 },
    /* shrine keeper */
    { id: 'kawarimi_charge', stall: 'shrine', kanji: '身', name: 'Substitution charge', sub: 'One more log to take the hit.', price: 800, kind: 'charge' },
    { id: 'title_epithet', stall: 'shrine', kanji: '号', name: 'Reforge epithet', sub: 'The village names you again.', price: 1800, kind: 'epithet', needsRank: 4 },
    { id: 'blood_reading', stall: 'shrine', kanji: '血', name: 'Blood Reading', sub: 'Spin the wheel again. The price doubles each time.', price: 2000, kind: 'reroll', needsRank: 2 },
    /* masks are earned, not bought — listed in the vault for the collection count */
    { id: 'mask_any', stall: 'vault', kanji: '面', name: 'ANBU mask', sub: 'Earned in Selection. Six exist; a burned one is gone.', price: 0, kind: 'maskinfo', vault: true },
    { id: 'aura_gold', stall: 'vault', kanji: '耀', name: 'Golden Sage aura', sub: 'A 200-day chain. The aura turns to light.', price: 0, kind: 'aura', val: 'gold', vault: true, needsStreak: 200 }
  ];
  G.STALLS = [['forge', '鍛', 'The Forge', 'weapons on the card'], ['tailor', '衣', 'The Tailor', 'cloth, cloaks'], ['ink', '墨', 'The Ink Shop', 'seal styles, card frames'], ['library', '書', 'The Scroll Library', 'village scenes'], ['shrine', '社', 'The Shrine Keeper', 'charges, names, blood'], ['vault', '宝', 'The Lineage Vault', 'deeds only — no ryō']];
  G.MARKET = G.BAZAAR; /* back-compat: old market calls find the bazaar */
  G.rerollPrice = function () { var n = (G.state.climb && G.state.climb.rerolls) | 0; return 2000 * Math.pow(2, n); };
  G.canBuy = function (item) {
    var st = G.state, owned = st.cosmetics.owned.indexOf(item.id) >= 0;
    if (item.kind === 'maskinfo') return { ok: false, why: st.cosmetics.mask ? 'worn' : 'earned in Selection' };
    if (item.kind !== 'charge' && item.kind !== 'epithet' && item.kind !== 'reroll' && owned) return { ok: false, why: 'owned' };
    if (item.needsRank && st.rankIdx < item.needsRank) return { ok: false, why: 'needs ' + G.RANKS[item.needsRank][0] };
    if (item.lvl && G.level() < item.lvl) return { ok: false, why: 'needs level ' + item.lvl };
    if (item.needs === 'sage' && !G.sageMode()) return { ok: false, why: 'needs Sage Mode' };
    if (item.needsJutsu && !G.hasJutsu(item.needsJutsu)) return { ok: false, why: 'needs ' + item.needsJutsu };
    if (item.needsClan && (!st.clan || st.clan.id !== item.needsClan)) return { ok: false, why: 'Uchiha blood only' };
    if (item.needsStreak && G.bestStreakEver() < item.needsStreak) return { ok: false, why: 'a ' + item.needsStreak + '-day chain' };
    if (item.kind === 'charge' && st.jutsu.charges >= G.kawarimiMax()) return { ok: false, why: 'charges full' };
    if (item.kind === 'charge' && !G.hasJutsu('kawarimi')) return { ok: false, why: 'needs Kawarimi' };
    var price = item.kind === 'reroll' ? G.rerollPrice() : item.price;
    if (!item.vault && st.ryo < price) return { ok: false, why: 'not enough ryō', price: price };
    return { ok: true, price: price };
  };
  G.buy = function (id) {
    var item = G.BAZAAR.filter(function (x) { return x.id === id; })[0]; if (!item) return { ok: false, why: 'no such item' };
    var can = G.canBuy(item); if (!can.ok) return can;
    var st = G.state; st.ryo -= can.price || 0;
    if (item.kind === 'charge') st.jutsu.charges++;
    else if (item.kind === 'epithet') st.epithet = G.forgeEpithet();
    else if (item.kind === 'reroll') { G.ensureClimb(); st.climb.rerolls = (st.climb.rerolls | 0) + 1; st.climb.pendingReroll = true; }
    else { st.cosmetics.owned.push(item.id); G.equip(item); }
    G.save(); return { ok: true, item: item, price: can.price };
  };
  G.equip = function (item) {
    var st = G.state, k = item.kind; if (['headband', 'frame', 'cloak', 'weapon', 'ink', 'scene', 'aura'].indexOf(k) < 0) return;
    st.cosmetics[k] = st.cosmetics[k] === item.id ? '' : item.id; G.save();
  };
  G.cosmetic = function (kind) { var id = G.state.cosmetics[kind]; return G.BAZAAR.filter(function (x) { return x.id === id; })[0] || null; };
  G.collection = function () {
    var st = G.state, total = 0, got = 0;
    G.BAZAAR.forEach(function (it) { if (it.kind === 'charge' || it.kind === 'epithet' || it.kind === 'reroll' || it.kind === 'maskinfo') return; total++; if (st.cosmetics.owned.indexOf(it.id) >= 0) got++; });
    G.SUMMONS.forEach(function (S) { total += 2; if (st.summons.owned.indexOf(S.id) >= 0) got++; if (st.summons.grown[S.id]) got++; });
    total += 6; got += (st.cosmetics.mask ? 1 : 0) + Math.min(5, (st.climb && st.climb.masks.burned.length) | 0) * 0; /* masks: worn counts, burned never */
    return { got: got, total: total, pct: Math.round(100 * got / total) };
  };
  G.doReroll = function () {
    var st = G.state; G.ensureClimb(); if (!st.climb.pendingReroll) return null;
    st.climb.pendingReroll = false; st.clan = G.rollClan(); G.save(); return st.clan;
  };

  /* ---------- insights: what the record actually says about you ---------- */
  G.insights = function () {
    var st = G.state, log = st.log, keys = Object.keys(log).sort();
    var out = { days: 0, seals: 0, chakra: 0, ryo: 0, best: G.bestStreakEver(), cur: G.streak(), byDow: [0, 0, 0, 0, 0, 0, 0], dowTotal: [0, 0, 0, 0, 0, 0, 0], months: [], skips: [], paths: [], hours: [0, 0, 0, 0] };
    var monthMap = {};
    keys.forEach(function (k) {
      var d = log[k], sealedAny = false;
      Object.keys(d).forEach(function (pid) {
        var e = d[pid]; if (!e.sealed) return;
        sealedAny = true; out.seals++; out.chakra += e.chakra | 0; out.ryo += e.ryo | 0;
        if (e.at) { var h = new Date(e.at).getHours(); out.hours[h < 6 ? 0 : h < 12 ? 1 : h < 18 ? 2 : 3]++; }
      });
      var pd = k.split('-'), dt = new Date(+pd[0], +pd[1] - 1, +pd[2]), dw = dt.getDay();
      out.dowTotal[dw]++; if (sealedAny) { out.days++; out.byDow[dw]++; }
      var mk = k.slice(0, 7); monthMap[mk] = monthMap[mk] || { k: mk, days: 0, chakra: 0 };
      if (sealedAny) monthMap[mk].days++;
      Object.keys(d).forEach(function (pid) { monthMap[mk].chakra += (d[pid].chakra | 0); });
    });
    out.months = Object.keys(monthMap).sort().slice(-6).map(function (k) { return monthMap[k]; });
    /* the steps you dodge: counted across the last 60 days of base scrolls */
    var skipN = {}, names = {};
    var k2 = G.today();
    for (var i = 0; i < 60; i++) {
      var dd = log[k2] || {};
      ['asageiko', 'fuin'].forEach(function (pid) { var e = dd[pid]; if (e) (e.skip || []).forEach(function (id) { skipN[id] = (skipN[id] || 0) + 1; }); });
      k2 = G.addDays(k2, -1);
    }
    ['asageiko', 'fuin'].forEach(function (pid) { ((st.protocols[pid] || {}).movements || []).forEach(function (m) { names[m.id] = m.name; }); });
    out.skips = Object.keys(skipN).filter(function (id) { return names[id]; }).map(function (id) { return { name: names[id], n: skipN[id] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 5);
    out.paths = G.PATHS.map(function (pr, i) { return { i: i, kanji: pr[0], name: pr[1].split(' — ')[0], n: G.pathMastery(pr[0]), hard: !!pr[5] }; })
      .filter(function (x) { return x.n; }).sort(function (a, b) { return b.n - a.n; });
    out.rate = out.dowTotal.map(function (t, i) { return t ? Math.round(100 * out.byDow[i] / t) : 0; });
    return out;
  };

  /* ---------- hero mood & climb card text ---------- */
  G.climbCard = function () {
    var st = G.state, c = G.ensureClimb(), s = G.trialStatus(), idx = st.rankIdx + 1, T = G.TRIALS[idx];
    if (!T) return { state: 'kage', title: 'The rock is carved', sub: c.kage.retired ? 'Retired ' + c.kage.retired + '× and retaken.' : 'There is nothing above this.', kanji: '影', voice: 'the village', line: 'Wear it to the morning.' };
    if (s) {
      var line = s.id === 'kage' ? s.arc.line : T.intro.split('.')[0] + '.';
      var title = s.id === 'kage' ? s.arc.name : s.id === 'forest' && s.stage === 2 ? 'Preliminaries' : T.name;
      var sub = s.hidden ? 'in the dark · day ' + (G.daysSince(s.trial.start) + 1) + ' of 7' : (s.got != null ? s.got + ' / ' + s.need : Math.round(s.pct * 100) + '%') + (s.left != null ? ' · ' + (s.left === 0 ? 'last day' : s.left + ' day' + (s.left > 1 ? 's' : '') + ' left') : '');
      return { state: 'active', title: title, sub: sub, kanji: s.id === 'kage' ? s.arc.kanji : T.kanji, voice: s.id === 'kage' ? s.arc.voice : T.voice, line: line, status: s };
    }
    var el = G.trialEligible();
    if (el.ok) return { state: 'ready', title: T.name + ' — ready', sub: 'Begin when you choose. Nothing starts without you.', kanji: T.kanji, voice: T.voice, line: T.intro.split('.')[0] + '.' };
    if (el.why === 'cooldown') return { state: 'cooldown', title: T.name, sub: 'reopens in ' + el.left + ' day' + (el.left > 1 ? 's' : ''), kanji: T.kanji, voice: T.voice, line: T.fail };
    return { state: 'locked', title: T.name, sub: (el.need || ['not yet'])[0], kanji: T.kanji, voice: T.voice, line: T.intro.split('.')[0] + '.', need: el.need };
  };
  G.heroMood = function () {
    var c = G.ensureClimb(), s = G.trialStatus(), sc = G.cosmetic('scene');
    if (s && s.id === 'kage') return s.arc.id === 'pain' ? 'crater' : s.arc.id === 'sage' ? 'myoboku' : s.arc.id === 'war' ? 'war' : 'summit';
    if (s && s.id === 'forest') return 'forest';
    if (s && s.id === 'anbu') return 'shadow';
    if (sc) return sc.val;
    if (G.state.rankIdx >= 6 && c.kage.carved) return 'rock';
    return G.streak() === 0 && G.lastSealedKey() && G.daysSince(G.lastSealedKey()) >= 2 ? 'storm' : '';
  };
})((typeof window !== 'undefined' ? window : global).HOKAGE = (typeof window !== 'undefined' ? window : global).HOKAGE || {});
