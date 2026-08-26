/* HOKAGE — game: chakra, levels, ryō, mission ranks, exams, jutsu, the Bingo Book, the Market. No DOM. */
(function (G) {
  'use strict';

  /* ---------- chakra per step ---------- */
  G.stepChakra = function (m, inPath) {
    var C = G.CHAKRA, v;
    if (m.type === 'section') return 0;
    if (m.type === 'timed') v = Math.min(C.timedCap, C.timedBase + Math.floor((m.secs || 0) / 30) * C.timedPer30s) * (m.sides ? 2 : 1);
    else if (m.type === 'reps') v = C.reps;
    else if (m.type === 'breath') v = C.breath * (G.senseiPerk('breathChakra') ? 2 : 1);
    else v = C.open;
    if (inPath && G.senseiPerk('pathChakra')) v *= 1.15;
    if (inPath && G.state.run && G.state.run.pathHard && G.clanPerk('hardChakra')) v *= G.clanPerk('hardChakra', 1);
    if (inPath && G.hasJutsu('hiraishin') && G.state.run && G.masteryTier(G.pathMastery(G.state.run.pathKanji)) >= 1) v *= 1.4;
    v *= G.clanPerk('chakra', 1);
    return Math.max(1, Math.round(v));
  };
  G.level = function () { return G.levelAt(G.state.chakra); };
  G.levelProgress = function () {
    var L = G.level(), lo = G.levelNeed(L), hi = G.levelNeed(L + 1);
    return { lvl: L, have: G.state.chakra - lo, need: hi - lo, pct: Math.min(1, (G.state.chakra - lo) / Math.max(1, hi - lo)), next: hi };
  };

  /* ---------- jutsu ---------- */
  G.hasJutsu = function (id) {
    var j = G.JUTSU.filter(function (x) { return x.id === id; })[0]; if (!j) return false;
    if (j.streak) return G.streak() >= j.streak;
    return G.level() >= j.lvl;
  };
  G.jutsuList = function () { return G.JUTSU.map(function (j) { return { j: j, on: G.hasJutsu(j.id) }; }); };
  G.sageMode = function () { return G.hasJutsu('sage'); };
  G.kawarimiMax = function () { return G.clanPerk('kawarimiMax', 2); };
  G.kawarimiEvery = function () { return G.clanPerk('kawarimiEvery', 7); };

  /* ---------- dawn: what happens when the app wakes up on a new day ---------- */
  G.dawn = function () {
    var st = G.state, out = { shielded: [], broke: false };
    var today = G.today();
    if (st.lastSeen === today) return out;
    /* the gap between the last covered day and yesterday */
    var last = G.lastSealedKey();
    if (last && G.hasJutsu('kawarimi')) {
      var gap = [], k = G.addDays(last, 1);
      var yest = G.addDays(today, -1);
      while (k <= yest && gap.length < 30) { if (!G.dayCovered(k)) gap.push(k); k = G.addDays(k, 1); }
      if (gap.length && gap.length <= st.jutsu.charges) {
        gap.forEach(function (g) { st.jutsu.used[g] = 1; st.jutsu.charges--; out.shielded.push(g); });
      } else if (gap.length) out.broke = true;
    }
    st.lastSeen = today;
    if (G.climbTick) { G.climbTick(out); }
    /* the librarian's nudge: fourteen days without a backup */
    if (st.prefs.backupNudge && st.sealedDays >= 3) {
      var lastB = st.lastBackupAt || st.created, gapB = Math.round((new Date(today) - new Date(lastB)) / 864e5);
      if (gapB >= 14 && !st.inbox.some(function (m) { return m.k === '蔵'; })) {
        st.inbox.push({ k: '蔵', t: 'The archive keeper worries', b: 'Your record lives only on this device. It has been ' + gapB + ' days since a copy left the vault. Settings → Export a backup — thirty seconds against losing everything.' });
      }
    }
    G.save();
    return out;
  };

  function promote(res, toIdx) {
    var st = G.state;
    st.rankIdx = toIdx != null ? toIdx : st.rankIdx + 1;
    st.exams.passed.push(st.rankIdx);
    st.exam = null;
    if (st.letters.indexOf(st.rankIdx) < 0) st.letters.push(st.rankIdx);
    res.promoted = G.rankInfo().name; res.promotedIdx = st.rankIdx;
    if (st.rankIdx >= 4 && !st.epithet) { st.epithet = G.forgeEpithet(); res.epithet = st.epithet; }
    if (st.rankIdx === 4) award('jonin_week', res);
  }
  G._promote = promote;

  /* ---------- bounties ---------- */
  function award(id, res) {
    var st = G.state; if (st.bounties[id]) return false;
    var b = G.BOUNTIES.filter(function (x) { return x[0] === id; })[0]; if (!b) return false;
    st.bounties[id] = G.today();
    var pay = Math.round(b[4] * (G.senseiPerk('ryo') ? 1.1 : 1) * G.clanPerk('ryo', 1));
    st.ryo += pay; st.ryoEarned += pay;
    if (res) res.bounties.push({ id: id, kanji: b[1], name: b[2], ryo: pay });
    return true;
  }
  G.award = award;
  G.checkBounties = function (res, ctx) {
    var st = G.state, streak = G.streak();
    ctx = ctx || {};
    if (st.missions >= 1) award('first_seal', res);
    if (st.missions >= 50) award('seals_50', res);
    if (st.missions >= 200) award('seals_200', res);
    if (streak >= 7) award('streak_7', res);
    if (streak >= 30) { award('streak_30', res); award('sage', res); }
    if (streak >= 100) award('streak_100', res);
    if (ctx.clone) award('clone_day', res);
    if (ctx.hard) award('hard_path', res);
    if (G.pathsSealed() >= G.PATHS.length) award('all_paths', res);
    var best = 0; G.PATHS.forEach(function (pr) { best = Math.max(best, G.pathMastery(pr[0])); });
    if (best >= 7) award('master_1', res);
    if (best >= 30) award('grand_1', res);
    var h = G.clock().getHours();
    if (ctx.sealing && h < 7) award('early', res);
    if (ctx.sealing && h >= 23) award('late', res);
    if (G.userScrolls().concat(G.userPaths()).some(function (pid) { return (st.protocols[pid].movements || []).length >= 5; })) award('forge', res);
    if (st.bounties.__shared) award('share', res);
    if (G.kitComplete()) award('kit', res);
    if (G.logTotal('走 The Run') >= 100 || G.logTotal('The Run') >= 100 || G.anyLogTotal('mi') >= 100) award('miles_100', res);
    if (st.jutsu.rasengans > 0) award('rasengan', res);
    if (G.level() >= 10) award('level_10', res);
    if (st.akatsuki) award('akatsuki', res);
    if (streak >= 50) award('streak_50', res);
    if (st.missions >= 500) award('seals_500', res);
    if (G.level() >= 20) award('level_20', res);
    if (Object.keys(st.weeks).length >= 4) award('weeks_4', res);
    if ((st.summons.owned || []).length >= 1) award('summon_1', res);
    if ((st.cosmetics.owned || []).length >= 10) award('spender', res);
    var passes = (st.climb && st.climb.history || []).filter(function (h) { return h.ev === 'pass'; }).length;
    if (passes >= 3) award('trial_3', res);
    st.cloneDays = st.cloneDays | 0; if (ctx.clone) st.cloneDays++;
    if (st.cloneDays >= 20) award('clone_20', res);
  };
  G.anyLogTotal = function (unit) {
    /* sum every logged number whose step declares this unit */
    var names = {}, t = 0;
    Object.keys(G.state.protocols).forEach(function (pid) { (G.state.protocols[pid].movements || []).forEach(function (m) { if (m.log === unit) names[m.name] = 1; }); });
    G.PATHS.forEach(function (pr) { pr[4].forEach(function (m) { if (m.log === unit) names[m.name] = 1; }); });
    Object.keys(names).forEach(function (n) { t += G.logTotal(n); });
    return t;
  };
  G.bountyEyes = function () {
    /* the Byakugan: live progress toward unclaimed bounties (Hyūga only calls this) */
    var st = G.state, streak = G.streak(), best = 0;
    G.PATHS.forEach(function (pr) { best = Math.max(best, G.pathMastery(pr[0])); });
    return { seals_50: st.missions + ' / 50', seals_200: st.missions + ' / 200', streak_7: streak + ' / 7', streak_30: streak + ' / 30', streak_100: streak + ' / 100',
      all_paths: G.pathsSealed() + ' / ' + G.PATHS.length, master_1: best + ' / 7', grand_1: best + ' / 30', level_10: 'level ' + G.level() + ' / 10', miles_100: Math.round(G.anyLogTotal('mi')) + ' / 100 mi' };
  };
  G.bountyProgress = function () { var n = 0; G.BOUNTIES.forEach(function (b) { if (G.state.bounties[b[0]]) n++; }); return { got: n, total: G.BOUNTIES.length }; };

  /* ---------- the seal: where the day becomes record ---------- */
  G.sealDay = function (secs) {
    var c = G.current(); if (!c) return null;
    var st = G.state, e = c.e, run = c.run, first = !e.sealed;
    e.sealed = true; e.at = G.now(); e.secs = secs | 0;
    e.sigil = run.pathKanji || c.p.kanji;
    var res = { sigil: e.sigil, promoted: null, epithet: null, chakra: 0, ryo: 0, rank: 'D', bounties: [], rasengan: 0, clone: false, levelUp: null, streak: 0, sRank: false };
    if (first) {
      var day = st.log[run.key];
      var sealsToday = Object.keys(day).filter(function (p) { return day[p].sealed; }).length;
      var firstToday = sealsToday === 1;
      var isBase = c.p.builtin;
      var clone = isBase && sealsToday >= 2 && ['asageiko', 'fuin'].every(function (pid) { return day[pid] && day[pid].sealed; }) && G.hasJutsu('bunshin');
      /* mission rank */
      var rank = 'D';
      if (run.pathKanji) rank = run.pathGrade || (run.pathHard ? 'B' : 'C');
      if (clone && rank !== 'S' && rank !== 'A') rank = G.RANK_ORDER[Math.min(3, G.RANK_ORDER.indexOf(rank) + 1)];
      e.rank = rank; res.rank = rank; res.clone = clone;
      /* chakra */
      var lvlBefore = G.level();
      var chakra = (run.chakra | 0) + G.CHAKRA.seal + (clone ? G.CHAKRA.cloneBonus : 0);
      chakra = Math.round(chakra * G.clanPerk('chakra', 1));
      st.chakra += chakra; e.chakra = chakra; res.chakra = chakra;
      /* ryō */
      var ryo = G.MISSION[rank].pay;
      if (run.pathHard && G.hasJutsu('chidori')) ryo *= 2;
      if (run.pathHard && G.senseiPerk('hardRyo')) ryo *= 1.3;
      if (clone) ryo *= 1.5;
      if (G.senseiPerk('ryo')) ryo *= 1.1;
      ryo = Math.round(ryo * G.clanPerk('ryo', 1));
      st.ryo += ryo; st.ryoEarned += ryo; e.ryo = ryo; res.ryo = ryo;
      /* merit & counts */
      if (firstToday) st.sealedDays++;
      st.missions++;
      st.score += c.p.mode === 'seal' ? 3 : 2;
      /* the chain */
      var streak = G.streak(); res.streak = streak;
      if (firstToday && streak > 0 && streak % G.kawarimiEvery() === 0 && G.hasJutsu('kawarimi') && st.jutsu.charges < G.kawarimiMax() && st.jutsu.lastEarnAt !== streak) {
        st.jutsu.charges++; st.jutsu.lastEarnAt = streak; res.charge = true;
      }
      if (firstToday && streak > 0 && streak % 7 === 0 && G.hasJutsu('rasengan')) {
        st.jutsu.rasengans++; st.chakra += 120; st.ryo += 300; st.ryoEarned += 300; res.rasengan = streak / 7; res.chakra += 120; res.ryo += 300;
      }
      /* the perfect week */
      var wk = G.weekKeys(run.key);
      if (wk.every(G.daySealed) && !st.weeks[wk[0]]) { st.weeks[wk[0]] = 1; st.ryo += G.MISSION.S.pay; st.ryoEarned += G.MISSION.S.pay; res.ryo += G.MISSION.S.pay; res.sRank = true; }
      /* the sage's ink: Jiraiya pays for every number you write down */
      var logN = Object.keys(e.logs || {}).length;
      if (logN && G.senseiPerk('logChakra')) { var lc = logN * 5; st.chakra += lc; e.chakra += lc; res.chakra += lc; res.logChakra = lc; }
      /* bounties, then the climb */
      G.checkBounties(res, { clone: clone, hard: !!run.pathHard, sealing: true });
      if (G.climbTick) G.climbTick(res);
      var lvlAfter = G.level();
      if (lvlAfter > lvlBefore) res.levelUp = { from: lvlBefore, to: lvlAfter, jutsu: G.JUTSU.filter(function (j) { return !j.streak && j.lvl > lvlBefore && j.lvl <= lvlAfter; }) };
    }
    st.run = null; G.save();
    return res;
  };


  /* ---------- words for today ---------- */
  G.dailyLine = function () {
    var s = G.sensei(); if (!s) return null;
    var k = G.today(), h = 0; for (var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
    return { sensei: s, line: s.lines[Math.abs(h) % s.lines.length] };
  };
  G.missionRankOf = function (pathIdx, pathHard, clone) {
    var pr = G.PATHS[pathIdx];
    var rank = pathIdx == null ? 'D' : (pr && pr[5] === 'S') ? 'S' : pathHard ? 'B' : 'C';
    if (clone && rank !== 'S') rank = G.RANK_ORDER[Math.min(3, G.RANK_ORDER.indexOf(rank) + 1)];
    return rank;
  };
  /* ---------- the upper ladder: earned once, open forever ---------- */
  G.releasedOpen = function (i) {
    var pr = G.PATHS[i]; if (!pr || !pr[5] || pr[5] === 'S') return false;
    var st = G.state;
    if (st.unlocks && st.unlocks['rel_' + pr[0]]) return true;
    if (G.pathMastery(pr[0]) >= 7 && st.rankIdx >= 4) { st.unlocks = st.unlocks || {}; st.unlocks['rel_' + pr[0]] = G.today(); G.save(); return true; }
    return false;
  };
  G.sixPathsOpen = function () {
    var st = G.state;
    if (st.unlocks && st.unlocks.sixpaths) return true;
    if (st.rankIdx >= 6) { st.unlocks = st.unlocks || {}; st.unlocks.sixpaths = G.today(); G.save(); return true; }
    return false;
  };
  G.pathLock = function (i) {
    var pr = G.PATHS[i];
    if (pr && pr[5] === 'S') return G.sixPathsOpen() ? null : { why: 'unlocks at Kage \u2014 the rock must be carved' };
    return null;
  };
  G.onLoad = function () { /* dawn runs from ui boot so it can announce; nothing here */ };
})((typeof window !== 'undefined' ? window : global).HOKAGE = (typeof window !== 'undefined' ? window : global).HOKAGE || {});
