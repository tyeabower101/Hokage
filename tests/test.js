/* HOKAGE tests — run: node tests/test.js */
'use strict';
var path = require('path');
global.btoa = function (s) { return Buffer.from(s, 'binary').toString('base64'); };
global.atob = function (s) { return Buffer.from(s, 'base64').toString('binary'); };
['data', 'lore', 'guides', 'core', 'game', 'climb'].forEach(function (f) { require(path.join(__dirname, '..', 'js', f + '.js')); });
var G = global.HOKAGE;

var mem = null;
G.storage = { get: function () { return mem; }, set: function (s) { mem = s; return true; }, del: function () { mem = null; } };
var clock = new Date(2026, 7, 22, 9, 0, 0); /* Sat Aug 22 2026 09:00 */
G.now = function () { return clock.getTime(); };
function setDay(y, m, d, h) { clock = new Date(y, m - 1, d, h == null ? 9 : h, 0, 0); }
function nextDay(h) { clock = new Date(clock.getTime() + 864e5); if (h != null) clock.setHours(h); }

var pass = 0, fail = 0;
function t(name, fn) { try { fn(); pass++; console.log('  ✓ ' + name); } catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + (e.stack || e).toString().split('\n').slice(0, 3).join('\n      ')); } }
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'eq') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b)); }
function ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); }

/* the clan roll is random and its perks change the math — pin it unless a test says otherwise */
function plainClan() { G.state.clan = { id: 'shiranui', name: 'Shiranui', tier: 'common', perk: 'calm under anything' }; G.save(); }
var _enroll = G.enroll;
G.enroll = function (v, n, nd) { _enroll.call(G, v, n, nd); plainClan(); };

/* run a whole base scroll and seal it, optionally with a path index */
function sealBase(pid, pathIdx) {
  G.startRun(pid, pathIdx == null ? null : G.materializePath(pathIdx));
  var c = G.current();
  for (var i = 0; i < c.mv.length; i++) G.completeAt(i);
  ok(G.allSettled(), 'all settled');
  return G.sealDay(600);
}

console.log('\nHOKAGE ' + G.VERSION + ' — logic tests\n');

console.log('state');
t('fresh state loads with base scrolls and the kit', function () {
  mem = null; G.load();
  eq(G.state.v, 2); ok(G.state.protocols.asageiko); ok(G.state.protocols.fuin);
  eq(Object.keys(G.state.dogu.items).length, G.KIT.length);
  eq(G.level(), 0); eq(G.state.ryo, 0);
});
t('v1 save migrates: rank kept, exams marked passed, inbox letter', function () {
  mem = JSON.stringify({ v: 1, name: 'Eli', village: 'konoha', clan: { id: 'uchiha', name: 'Uchiha', tier: 'legendary', perk: 'x' }, rankIdx: 3, score: 160, missions: 70, sealedDays: 40, log: {}, protocols: {}, dogu: { items: {}, seeded: 1 } });
  G.load();
  eq(G.state.v, 2); eq(G.state.rankIdx, 3); eq(G.state.exams.passed, [1, 2, 3]);
  ok(G.state.chakra > 0, 'chakra seeded'); ok(G.state.inbox.length === 1, 'inbox');
  ok(G.state.protocols.asageiko.movements.length > 5, 'base restored');
});
t('corrupt input is tolerated', function () {
  mem = '{"v":2,"rankIdx":99,"jutsu":"nope","protocols":{"x":5},"chakra":-4}'; G.load();
  eq(G.state.rankIdx, 6); eq(G.state.jutsu.charges, 0); eq(G.state.chakra, 0); ok(!G.state.protocols.x);
  mem = 'garbage{'; G.load(); eq(G.state.v, 2);
});

console.log('\nidentity');
t('enroll forges a name, rolls a clan, keeps nindō', function () {
  mem = null; G.load(); G.enroll('konoha', 'Eli', 'I keep the morning.');
  ok(G.state.sName.k && G.state.sName.r); ok(G.state.clan && G.state.clan.tier); eq(G.state.nindo, 'I keep the morning.');
  ok(/^HK-\d{4}$/.test(G.state.reg));
});
t('clan roll respects tier odds (1000 rolls)', function () {
  var n = { legendary: 0, rare: 0, noble: 0, common: 0 };
  for (var i = 0; i < 1000; i++) n[G.rollClan().tier]++;
  ok(n.legendary < 120 && n.common > 350, JSON.stringify(n));
  /* deterministic rng */
  eq(G.rollClan(function () { return 0.01; }).tier, 'legendary'); eq(G.rollClan(function () { return 0.99; }).tier, 'common');
});
t('name forge is deterministic per name+village', function () {
  var a = G.forgeName('Eli'); var b = G.forgeName('Eli'); eq(a, b);
});

console.log('\nthe run & the seal');
t('sealing the morning base pays chakra, ryō (D-rank), merit and a bounty', function () {
  mem = null; G.load(); G.enroll('konoha', 'Eli'); G.setSensei('iruka'); setDay(2026, 8, 22, 9);
  var res = sealBase('asageiko');
  eq(res.rank, 'D'); ok(res.chakra >= 30, 'chakra ' + res.chakra); ok(res.ryo >= 50, 'ryo');
  eq(G.state.missions, 1); eq(G.state.sealedDays, 1); eq(G.state.score, 2);
  ok(res.bounties.some(function (b) { return b.id === 'first_seal'; }), 'first blood');
  eq(G.streak(), 1);
});
t('a path makes it C-rank; a 極 path makes it B-rank and pays the vow bounty', function () {
  var r1 = sealBase('fuin', 6); eq(r1.rank, 'C');
  nextDay(); var r2 = sealBase('fuin', 5); eq(r2.rank, 'B'); ok(r2.bounties.some(function (b) { return b.id === 'hard_path'; }));
  eq(G.pathMastery('砂'), 1); eq(G.pathMastery('覇'), 1);
});
t('sealing twice does not pay twice', function () {
  var before = G.state.chakra; G.startRun('fuin'); var c = G.current(); for (var i = 0; i < c.mv.length; i++) G.completeAt(i); G.sealDay(1);
  eq(G.state.chakra, before);
});
t('uncomplete refunds run chakra', function () {
  G.startRun('asageiko'); G.completeAt(0); var g = G.state.run.chakra; ok(g > 0); G.uncompleteAt(0); eq(G.state.run.chakra, 0); G.abandonRun();
});
t('day-of-week steps are filtered from the run', function () {
  setDay(2026, 8, 24, 21); /* Monday */
  G.startRun('fuin'); var names = G.runMv().map(function (m) { return m.name; });
  ok(names.some(function (n) { return /Minoxidil/.test(n); }), 'minox on Monday');
  ok(!names.some(function (n) { return /Stamp night/.test(n); }), 'no stamp on Monday');
  G.abandonRun();
});

console.log('\nthe climb');
t('Bell Test: opt-in, 3 of 7 with one both-bells day → Genin', function () {
  mem = null; G.load(); G.enroll('suna', 'Eli'); G.setSensei('kakashi');
  setDay(2026, 9, 1, 8);
  eq(G.trialEligible().ok, false, 'needs a seal first');
  sealBase('asageiko'); ok(G.trialEligible().ok); ok(G.startTrial().ok);
  nextDay(); sealBase('asageiko'); nextDay(); var r = sealBase('asageiko');
  eq(r.promoted, null, 'three seals but no both-bells day');
  var r2 = sealBase('fuin'); eq(r2.promoted, 'Genin'); eq(G.state.rankIdx, 1); ok(G.state.letters.indexOf(1) >= 0);
});
t('Forest of Death: a day without a path kills; cooldown 14; shields do not help', function () {
  G.state.chakra = 500; G.state.jutsu.charges = 2;
  for (var i = 0; i < 5; i++) { sealBase('asageiko', 0); nextDay(); }
  ok(G.trialEligible().ok, 'eligible after 5-chain'); ok(G.startTrial().ok);
  sealBase('asageiko', 0); nextDay(); sealBase('asageiko'); /* no path */ nextDay();
  var d = G.dawn(); ok(d.climb.some(function (x) { return x.ev === 'fail' && x.id === 'forest'; }), 'died');
  eq(G.state.climb.trial, null); var el = G.trialEligible(); eq(el.why, 'cooldown'); ok(el.left >= 12);
});
t('Forest survived → Preliminaries vs weakest step → Chūnin', function () {
  for (var i = 0; i < 15; i++) nextDay();
  ok(G.trialEligible().ok); ok(G.startTrial().ok);
  var r;
  for (var d = 0; d < 5; d++) { r = sealBase(d % 2 ? 'fuin' : 'asageiko', d % 2 ? 6 : 0); if (d < 4) nextDay(); }
  ok(r.climb.some(function (x) { return x.ev === 'stage'; }), 'prelims opened'); eq(G.state.climb.trial.stage, 2);
  var w = G.state.climb.trial.weakest; ok(w && w.name);
  var res; for (var k = 0; k < 3; k++) { res = sealBase(w.pid); if (k < 2) nextDay(); }
  eq(res.promoted, 'Chūnin'); eq(G.state.rankIdx, 2);
});
t('withdraw is clean: short cooldown, no fail counted', function () {
  G.state.climb.cooldown = {}; G.startTrial({ track: 'tai' }); ok(G.state.climb.trial); G.withdrawTrial();
  eq(G.state.climb.trial, null); eq(G.state.climb.fails.spec | 0, 0); eq(G.trialEligible().why, 'cooldown');
});
t('demotion after 21 silent days, never below Genin', function () {
  for (var i = 0; i < 22; i++) nextDay();
  G.dawn(); eq(G.state.rankIdx, 1); for (var j = 0; j < 22; j++) nextDay(); G.dawn(); eq(G.state.rankIdx, 1);
});
t('Kawarimi shields a single missed day once unlocked and charged', function () {
  mem = null; G.load(); G.enroll('kiri', 'Eli'); setDay(2026, 10, 1, 8);
  G.state.chakra = 200; /* level 2 → kawarimi */
  ok(G.hasJutsu('kawarimi'));
  G.state.jutsu.charges = 1;
  sealBase('asageiko'); nextDay(); sealBase('asageiko');
  nextDay(); /* miss */ nextDay();
  var d = G.dawn(); eq(d.shielded.length, 1); eq(G.state.jutsu.charges, 0);
  eq(G.streak(), 3, 'chain held through the gap');
  sealBase('asageiko'); eq(G.streak(), 4);
});
t('no charge → the chain breaks honestly', function () {
  nextDay(); nextDay(); var d = G.dawn(); ok(d.broke); eq(G.streak(), 0);
});
t('a 7-day chain earns a charge; at level 7 it also spins a Rasengan', function () {
  mem = null; G.load(); G.enroll('kumo', 'Eli'); setDay(2026, 11, 2, 8);
  G.state.chakra = G.levelNeed(7);
  var res;
  for (var i = 0; i < 7; i++) { res = sealBase('asageiko'); if (i < 6) nextDay(); }
  eq(res.streak, 7); eq(res.rasengan, 1); eq(G.state.jutsu.charges, 1); ok(res.charge);
  ok(res.bounties.some(function (b) { return b.id === 'rasengan'; }) && res.bounties.some(function (b) { return b.id === 'streak_7'; }));
});
t('a perfect Monday→Sunday week pays S-rank once', function () {
  mem = null; G.load(); G.enroll('iwa', 'Eli'); setDay(2026, 11, 2, 8); /* Monday */
  var res; for (var i = 0; i < 7; i++) { res = sealBase('asageiko'); if (i < 6) nextDay(); }
  ok(res.sRank, 'S-rank'); ok(res.ryo >= 1050);
  var again = sealBase('fuin'); ok(!again.sRank, 'not twice');
});
t('Shadow Clone bumps rank and pays more', function () {
  mem = null; G.load(); G.enroll('ame', 'Eli'); setDay(2026, 12, 1, 8);
  G.state.chakra = G.levelNeed(4);
  var a = sealBase('asageiko'); var b = sealBase('fuin');
  eq(a.rank, 'D'); eq(b.rank, 'C'); ok(b.clone); ok(b.ryo > a.ryo);
  ok(b.bounties.some(function (x) { return x.id === 'clone_day'; }));
});

t('Jōnin trial: 14 days, both bases, a path, never repeated', function () {
  mem = null; G.load(); G.enroll('kiri', 'Eli'); setDay(2027, 1, 4, 8); G.state.rankIdx = 3; G.state.chakra = 3000;
  /* add a breath + a medical step so the scrolls cover all three tracks */
  G.state.protocols.asageiko.movements.push(G.mkStep('Box breath', '', { type: 'breath', breath: [4,4,4,4,3] }));
  for (var i = 0; i < 14; i++) { sealBase('asageiko'); nextDay(); }
  ok(G.trialEligible().ok, JSON.stringify(G.trialEligible())); ok(G.startTrial().ok);
  var r; for (var d = 0; d < 14; d++) { sealBase('asageiko', d % 2 ? 1 : 0); r = sealBase('fuin'); if (d < 13) nextDay(); }
  eq(r.promoted, 'Jōnin'); eq(G.state.rankIdx, 4); ok(G.state.epithet);
  /* repeating a path breaks it */
  G.state.rankIdx = 3; G.state.climb.trial = null; G.state.climb.cooldown = {}; nextDay(); G.startTrial();
  sealBase('asageiko', 0); sealBase('fuin'); nextDay(); var rr = sealBase('asageiko', 0);
  ok(rr.climb.some(function (x) { return x.ev === 'fail'; }), 'repeat fails'); eq(G.state.climb.fails.jonin, 1);
});
t('ANBU Selection: the week is hidden, the mask burns on a miss, a pass wears it', function () {
  G.state.rankIdx = 4; G.state.climb.promotedAt[4] = G.addDays(G.today(), -30); G.state.climb.cooldown = {}; G.state.climb.trial = null;
  G.state.bestStreak = 60; G.state.chakra = 6000;
  /* master three paths by seeding the log */
  var k = G.addDays(G.today(), -200);
  ['門', '誠', '砂'].forEach(function (sg) { for (var i = 0; i < 7; i++) { G.state.log[k] = { asageiko: { done: [], skip: [], sealed: true, sigil: sg, rank: 'C' } }; k = G.addDays(k, 1); } });
  ok(G.trialEligible().ok, JSON.stringify(G.trialEligible()));
  eq(G.startTrial({ mask: 'nope' }).ok, false); ok(G.startTrial({ mask: 'wolf' }).ok); ok(G.state.climb.shadow);
  ok(G.trialStatus().hidden); sealBase('asageiko', 1); sealBase('fuin'); nextDay(); sealBase('asageiko'); nextDay();
  var d = G.dawn(); ok(d.climb.some(function (x) { return x.ev === 'fail' && x.mask === 'wolf'; })); eq(G.state.climb.masks.burned, ['wolf']); ok(!G.state.climb.shadow);
  for (var i = 0; i < 22; i++) nextDay(); G.state.bestStreak = 60;
  ok(G.startTrial({ mask: 'cat' }).ok); var r;
  for (var dd = 0; dd < 7; dd++) { sealBase('asageiko', dd < 3 ? 1 : 0); r = sealBase('fuin'); if (dd < 6) nextDay(); }
  eq(r.promoted, 'ANBU'); eq(G.state.cosmetics.mask, 'cat');
});
t('Kage: Pain → Sage → War → Summit, arcs advance, summit fail keeps arcs', function () {
  G.state.climb.promotedAt[5] = G.addDays(G.today(), -40); G.state.climb.cooldown = {};
  ok(G.trialEligible().ok, JSON.stringify(G.trialEligible())); ok(G.startTrial().ok); eq(G.state.climb.trial.arc, 0);
  var r; for (var d = 0; d < 12; d++) { sealBase('asageiko', 0); r = sealBase('fuin'); nextDay(); }
  eq(G.state.climb.trial.arc, 1, 'sage arc');
  for (var i = 0; i < 30; i++) { r = sealBase('asageiko', i % 3); nextDay(); }
  eq(G.state.climb.trial.arc, 2, 'war arc');
  /* the war: seed mastery + big scrolls, then 26 sealed days with 5 distinct paths and perfect weeks */
  G.PATHS.forEach(function (pr, i) { for (var j = 0; j < 8; j++) { var kk = G.addDays(G.today(), -400 + i * 10 + j); G.state.log[kk] = { asageiko: { done: [], skip: [], sealed: true, sigil: pr[0], rank: pr[5] ? 'B' : 'C' } }; } });
  ['asageiko', 'fuin'].forEach(function (pid) { while (G.state.protocols[pid].movements.filter(function (m) { return m.type !== 'path'; }).length < 12) G.state.protocols[pid].movements.push(G.mkStep('Extra', '', {})); });
  for (var w = 0; w < 28 && G.state.climb.trial.arc < 3; w++) { r = sealBase('asageiko', w % 5); nextDay(); }
  eq(G.state.climb.trial.arc, 3, 'summit arc ' + JSON.stringify(G.trialStatus().lines));
  var wk = G.state.climb.trial.weakest; ok(wk);
  sealBase('asageiko', 1); r = sealBase('fuin'); nextDay(); sealBase('asageiko'); /* not hard */ sealBase('fuin'); nextDay(); r = G.dawn();
  eq(G.state.climb.trial, null, 'summit lost'); ok(G.state.climb.kage.arcs.war, 'arcs kept'); eq(G.state.rankIdx, 5); eq(G.trialEligible().why, 'cooldown');
  for (var c = 0; c < 31; c++) nextDay(); G.state.climb.trial = null;
  ok(G.startTrial().ok); /* restarts at Pain — the arcs are the campaign, not a checkpoint; summit fails are scarred */
});

console.log('\nmarket & cosmetics');
t('bazaar: ryō, gates, equip, vault, reroll doubles', function () {
  mem = null; G.load(); G.enroll('oto', 'Eli');
  eq(G.buy('fr_gold').ok, false);
  G.state.ryo = 3000; ok(G.buy('fr_gold').ok); eq(G.state.ryo, 600); eq(G.state.cosmetics.frame, 'fr_gold');
  eq(G.buy('fr_gold').why, 'owned'); G.state.ryo = 50000; eq(G.buy('fr_sage').why, 'needs Sage Mode');
  eq(G.buy('w_kunai').why, 'needs level 3'); eq(G.buy('ck_kage').why, 'needs Kage'); eq(G.buy('blood_reading').why, 'needs Chūnin');
  G.state.rankIdx = 2; eq(G.rerollPrice(), 2000); ok(G.buy('blood_reading').ok); eq(G.rerollPrice(), 4000); ok(G.doReroll() && G.state.clan.id);
  eq(G.buy('kawarimi_charge').ok, false); G.state.chakra = 200; ok(G.buy('kawarimi_charge').ok); eq(G.state.jutsu.charges, 1);
  ok(G.collection().total > 30);
});
t('summons unlock by deed, sign for ryō, the vault is free', function () {
  eq(G.summonState('toad').unlocked, false); G.state.bestStreak = 30; ok(G.summonState('toad').unlocked);
  G.state.ryo = 100; eq(G.signContract('toad').why, 'not enough ryō'); G.state.ryo = 3000; ok(G.signContract('toad').signed); eq(G.state.summons.active, 'toad');
  G.state.rankIdx = 6; ok(G.signContract('kyubi').signed); eq(G.state.ryo, 0);
});

console.log('\nsharing');
t('path export/import round-trips (v1 code format)', function () {
  mem = null; G.load(); G.enroll('taki', 'Eli');
  var pid = G.newScroll('path'); var p = G.state.protocols[pid]; p.name = 'Test Path'; p.kanji = '試';
  p.movements = [G.mkStep('Hang', 'grip', { type: 'timed', secs: 45, sides: 1 }), G.mkStep('Push', '', { type: 'reps', reps: 20 }), G.mkStep('Box', '', { type: 'breath', breath: [4, 4, 4, 4, 3] }), G.mkStep('Run', '', { log: 'mi' })];
  p.movements.forEach(function (m) { m.id = G.uid('m'); });
  var code = G.exportPath(pid); ok(/^HOKAGE1:/.test(code));
  var id2 = G.importPath('hey here is my path\n' + code + '\nenjoy'); var q = G.state.protocols[id2];
  eq(q.name, 'Test Path'); eq(q.movements.length, 4); eq(q.movements[0].sides, 1); eq(q.movements[2].breath, [4, 4, 4, 4, 3]); eq(q.movements[3].log, 'mi');
  var thrown = false; try { G.importPath('HOKAGE1:zzz:'); } catch (e) { thrown = true; } ok(thrown);
});

console.log('\nthe logical day');
t('before 4 AM it is still yesterday; a 5 AM rise is a new day; the setting moves the line', function () {
  mem = null; G.load(); G.enroll('konoha', 'Eli');
  setDay(2027, 3, 10, 2); /* 2 AM on the 10th */
  eq(G.today(), '2027-03-09', 'the night belongs to the night');
  setDay(2027, 3, 10, 5); eq(G.today(), '2027-03-10', '5 AM is morning');
  G.state.prefs.dayStart = 0; setDay(2027, 3, 10, 2); eq(G.today(), '2027-03-10', 'midnight purists get midnight');
  G.state.prefs.dayStart = 4;
});
t('a seal at 1 AM lands on the evening\u2019s day and the chain holds through the night', function () {
  mem = null; G.load(); G.enroll('suna', 'Eli');
  setDay(2027, 4, 1, 21); sealBase('asageiko');
  setDay(2027, 4, 2, 1); sealBase('fuin'); /* 1 AM, still Apr 1 logically */
  eq(Object.keys(G.state.log).length, 1, 'one logical day');
  setDay(2027, 4, 2, 9); sealBase('asageiko'); eq(G.streak(), 2);
});
t('week display can start Sunday while S-rank weeks stay Monday-anchored', function () {
  setDay(2027, 4, 7, 9); /* Wednesday Apr 7 2027 */
  var mon = G.weekKeysDisplay(); eq(mon[0], '2027-04-05', 'Monday start');
  G.state.prefs.weekStart = 'sun'; var sun = G.weekKeysDisplay(); eq(sun[0], '2027-04-04', 'Sunday start');
  eq(G.weekKeys()[0], '2027-04-05', 'internal week unmoved'); G.state.prefs.weekStart = 'mon';
});
t('Jiraiya pays +5 chakra per logged number', function () {
  mem = null; G.load(); G.enroll('taki', 'Eli'); G.setSensei('jiraiya'); setDay(2027, 5, 1, 9);
  G.startRun('asageiko'); var c = G.current();
  for (var i = 0; i < c.mv.length; i++) G.completeAt(i);
  G.runLog(c.mv[0].name, 12); G.runLog(c.mv[1].name, 3);
  var res = G.sealDay(300); eq(res.logChakra, 10);
});

console.log('\nthe grade ladder');
t('custom paths grade C, or B when the forger vows 極 — never higher', function () {
  mem = null; G.load(); G.enroll('konoha', 'Eli'); setDay(2027, 8, 2, 8);
  var pid = G.newScroll('path'), p = G.state.protocols[pid];
  p.name = 'My Road'; p.movements.push(G.mkStep('One thing', '', {}));
  var r1 = (function () { G.startRun('asageiko', { name: p.name, kanji: p.kanji, hard: !!p.hard, grade: p.hard ? 'B' : 'C', steps: G.deep(p.movements) }); var c = G.current(); for (var i = 0; i < c.mv.length; i++) G.completeAt(i); return G.sealDay(60); })();
  eq(r1.rank, 'C');
  p.hard = true; nextDay();
  var r2 = (function () { G.startRun('asageiko', { name: p.name, kanji: p.kanji, hard: true, grade: 'B', steps: G.deep(p.movements) }); var c = G.current(); for (var i = 0; i < c.mv.length; i++) G.completeAt(i); return G.sealDay(60); })();
  eq(r2.rank, 'B'); eq(r2.ryo >= 250, true);
});
t('Released opens at mastery 7 + Jōnin, grades A, and is permanent', function () {
  eq(G.releasedOpen(1), false, 'not yet');
  var k = G.addDays(G.today(), -50);
  for (var i = 0; i < 7; i++) { G.state.log[k] = { asageiko: { done: [], skip: [], sealed: true, sigil: '誠', rank: 'B' } }; k = G.addDays(k, 1); }
  eq(G.releasedOpen(1), false, 'mastered but not Jōnin');
  G.state.rankIdx = 4;
  eq(G.releasedOpen(1), true, 'open'); ok(G.state.unlocks['rel_誠'], 'recorded forever');
  G.state.rankIdx = 2; eq(G.releasedOpen(1), true, 'permanent even if demoted');
  nextDay();
  var path = G.materializePath(1, true); eq(path.grade, 'A');
  G.startRun('asageiko', path); var c = G.current(); for (var i = 0; i < c.mv.length; i++) G.completeAt(i);
  var r = G.sealDay(300); eq(r.rank, 'A'); eq(r.ryo >= 450, true);
});
t('the Six Paths Vigil is locked below Kage, grades S at Kage, and the clone cannot stack past it', function () {
  ok(G.pathLock(10), 'locked'); eq(G.sixPathsOpen(), false);
  G.state.rankIdx = 6; eq(G.sixPathsOpen(), true); eq(G.pathLock(10), null); ok(G.state.unlocks.sixpaths);
  nextDay();
  var sp = G.materializePath(10); eq(sp.grade, 'S');
  G.startRun('fuin', sp); var c = G.current(); for (var i = 0; i < c.mv.length; i++) G.completeAt(i);
  var r = G.sealDay(600); eq(r.rank, 'S'); eq(G.missionRankOf(1, true, true), 'A', 'clone bumps a B day to A'); eq(G.missionRankOf(10, true, true), 'S', 'the Vigil is already the summit');
});
t('share codes carry the 極 vow and step references', function () {
  var pid = G.userPaths()[0]; var p = G.state.protocols[pid];
  p.hard = true; p.movements[0].ref = { url: 'https://example.com/form', note: 'form video' };
  var code = G.exportPath(pid);
  mem = null; G.load(); G.enroll('suna', 'Rin');
  var got = G.importPath(code); var q = G.state.protocols[got];
  eq(q.hard, true); eq(q.movements[0].ref.url, 'https://example.com/form');
});

console.log('\nthe forge');
t('sections organize the scroll but never run and never pay', function () {
  mem = null; G.load(); G.enroll('konoha', 'Eli'); setDay(2027, 6, 1, 9);
  var p = G.state.protocols.asageiko, n0 = p.movements.length;
  G.startRun('asageiko'); var mv0 = G.current().mv.length; G.abandonRun();
  var sec = G.mkStep('Skin', '', { type: 'section' }); sec.id = G.uid('m');
  p.movements.splice(2, 0, sec); G.save();
  eq(G.stepChakra(sec, false), 0, 'a section is worth nothing');
  G.startRun('asageiko');
  var c = G.current();
  ok(c.mv.every(function (m) { return m.type !== 'section'; }), 'sections never enter the run');
  eq(c.mv.length, mv0, 'step count unchanged');
  eq(G.scrollStats('asageiko').steps, n0, 'stats ignore sections');
  G.abandonRun();
});
t('scrollStats measures steps, minutes and chakra', function () {
  var st = G.scrollStats('asageiko');
  ok(st.steps > 0 && st.mins >= 1 && st.chakra > 0, JSON.stringify(st));
});
t('undo restores the scroll exactly; moving and duplicating work', function () {
  var p = G.state.protocols.asageiko, before = p.movements.length;
  G.snapshot('asageiko', 'the step');
  p.movements.splice(0, 1); G.save();
  eq(G.state.protocols.asageiko.movements.length, before - 1);
  ok(G.canUndo()); eq(G.undoLabel(), 'the step');
  G.undo(); eq(G.state.protocols.asageiko.movements.length, before, 'undone');
  var dup = G.duplicateScroll('asageiko');
  ok(dup && G.state.protocols[dup].movements.length === before, 'duplicated');
  ok(!G.state.protocols[dup].builtin, 'the copy is yours to delete');
  ok(G.state.protocols[dup].movements[0].id !== G.state.protocols.asageiko.movements[0].id, 'fresh ids');
  var fromN = G.state.protocols.asageiko.movements.length;
  ok(G.moveStep('asageiko', 0, dup));
  eq(G.state.protocols.asageiko.movements.length, fromN - 1);
  eq(G.state.protocols[dup].movements.length, before + 1);
});
t('optional steps survive the round trip', function () {
  var m = G.state.protocols.asageiko.movements[0]; m.opt = true; G.save(); G.load();
  eq(G.state.protocols.asageiko.movements[0].opt, true);
});

console.log('\nlevels');
t('level curve is monotone and reachable', function () {
  eq(G.levelAt(0), 0); eq(G.levelAt(29), 0); eq(G.levelAt(30), 1); eq(G.levelAt(3000), 10);
  var p; G.state.chakra = 100; p = G.levelProgress(); eq(p.lvl, 1); ok(p.pct > 0 && p.pct < 1);
});

console.log('\nthe timer engine');
t('a timer is idle until started, then counts on the wall clock', function () {
  mem = null; G.load(); G.enroll('konoha', 'Eli', '');
  G.startRun('asageiko'); var c = G.current();
  var m = c.mv.filter(function (x) { return x.type === 'timed'; })[0]; ok(m, 'a timed step exists');
  eq(G.timerGet(m).status, 'idle'); eq(G.timerLeft(m), m.secs);
  G.timerStart(m); eq(G.timerGet(m).status, 'running');
  clock = new Date(clock.getTime() + 25000); eq(G.timerLeft(m), m.secs - 25);
});
t('a timer survives a reload — the phone can lock', function () {
  var c = G.current(); var m = c.mv.filter(function (x) { return x.type === 'timed'; })[0];
  G.load(); c = G.current(); var m2 = c.mv.filter(function (x) { return x.id === m.id; })[0];
  eq(G.timerGet(m2).status, 'running'); eq(G.timerLeft(m2), m.secs - 25);
});
t('pause freezes it, resume continues from the frozen value', function () {
  var c = G.current(); var m = c.mv.filter(function (x) { return x.type === 'timed'; })[0];
  G.timerPause(m); var left = G.timerLeft(m); clock = new Date(clock.getTime() + 60000); eq(G.timerLeft(m), left, 'frozen');
  G.timerStart(m); clock = new Date(clock.getTime() + 5000); eq(G.timerLeft(m), left - 5);
});
t('tick reports flip for two-sided steps and done at zero; completing a step clears its timer', function () {
  var c = G.current(); var m = c.mv.filter(function (x) { return x.type === 'timed'; })[0];
  m.sides = 1; G.timerReset(m); G.timerStart(m);
  clock = new Date(clock.getTime() + (m.secs + 1) * 1000); eq(G.timerTick(m), 'flip'); ok(G.timerGet(m).side2);
  eq(G.timerTick(m), null, 'side two still running');
  clock = new Date(clock.getTime() + (m.secs + 1) * 1000); eq(G.timerTick(m), 'done');
  var i = c.mv.indexOf(m); G.completeAt(i); eq(G.state.run.timer, null);
  m.sides = 0;
});

console.log('\nthe guides');
t('every built-in step has its own guide — never the generic fallback', function () {
  var names = [];
  G.PATHS.forEach(function (p) { p[4].forEach(function (m) { if (m.type !== 'section') names.push(m); }); });
  G.LIB.forEach(function (s) { s[1].forEach(function (m) { names.push(m); }); });
  var b = G.baseProtocols(); Object.keys(b).forEach(function (k) { b[k].movements.forEach(function (m) { if (m.type !== 'section' && m.type !== 'path') names.push(m); }); });
  var generic = names.filter(function (m) { var gd = G.guideFor(m); return !gd || gd.id === 'generic'; }).map(function (m) { return m.name; });
  eq(generic, [], 'steps without a specific guide');
  ok(names.length > 150, 'enough steps checked');
});
t('every guide draws, teaches four lines, names the mistake, and links honestly', function () {
  G.GUIDES.forEach(function (g) {
    ok(G.guideSVG(g).indexOf('<svg') === 0, g.id + ' draws');
    eq(g.how.length, 4, g.id + ' how');
    ok(g.miss && g.miss.length > 8, g.id + ' mistake');
    if (g.link) ok(/^https:\/\//.test(g.link.url), g.id + ' link is https');
  });
});

console.log('\n' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail ? 1 : 0);
