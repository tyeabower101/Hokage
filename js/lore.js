/* HOKAGE — lore: the deeper world. Exams, jutsu, sensei, the Bingo Book, the Kage's letters, the market. */
(function (G) {
  'use strict';

  /* ---------- chakra: what each stamp is worth ---------- */
  G.CHAKRA = { open: 2, reps: 3, breath: 4, timedBase: 2, timedPer30s: 1, timedCap: 10, seal: 10, cloneBonus: 15 };
  /* level L needs 30·L² chakra. L5 ≈ a week of real work, L10 ≈ a month, L30 ≈ a year. */
  G.levelAt = function (chakra) { var L = Math.floor(Math.sqrt(Math.max(0, chakra) / 30)); return Math.min(99, L); };
  G.levelNeed = function (L) { return 30 * L * L; };

  /* ---------- mission ranks & pay ---------- */
  G.MISSION = { D: { pay: 50, name: 'D-rank', sub: 'the base scroll, sealed' }, C: { pay: 120, name: 'C-rank', sub: 'a path ridden' }, B: { pay: 250, name: 'B-rank', sub: 'a \u6975 path endured' }, A: { pay: 450, name: 'A-rank', sub: 'a Released path \u00b7 or the clone day, hard' }, S: { pay: 1000, name: 'S-rank', sub: 'the Six Paths Vigil \u00b7 or a perfect week' } };
  G.RANK_ORDER = ['D', 'C', 'B', 'A', 'S'];

  /* ---------- exams: merit opens the door, the week decides ---------- */
  /* index = the rank being earned. need of days sealed within window days. */
  G.EXAMS = [
    null,
    { kanji: '鈴', name: 'The Bell Test', need: 3, days: 7, line: 'Two bells, three of you. Take one from me — or go hungry. Seal three days of seven.' },
    { kanji: '試', name: 'The Chūnin Exams', need: 5, days: 7, line: 'The forest does not care how you feel. Five sealed days of seven, and the tower is yours.' },
    { kanji: '特', name: 'The Special Assignment', need: 6, days: 7, line: 'A specialist is trusted alone. Six days of seven — one slip is the whole lesson.' },
    { kanji: '上', name: 'The Jōnin Trial', need: 7, days: 7, line: 'There is no partial Jōnin. Seven days. Every one of them sealed.' },
    { kanji: '暗', name: 'The Mask', need: 12, days: 14, line: 'ANBU do not get applause. Twelve of fourteen, in the dark, with no one watching.' },
    { kanji: '頂', name: 'The Summit', need: 24, days: 28, line: 'The village chooses a Kage by what they do when no one could blame them for stopping. Twenty-four of twenty-eight.' }
  ];

  /* ---------- jutsu: unlocked by chakra level, each with a real mechanic ---------- */
  G.JUTSU = [
    { id: 'kawarimi', kanji: '身', name: 'Kawarimi — Substitution', lvl: 2, sign: 'ram', color: '#9cc98a',
      sub: 'A log takes the hit. One charge shields one missed day; the chain holds.',
      how: 'Earn a charge every 7 sealed days (max 2). Buy extra in the Market. Used automatically the morning after a miss.' },
    { id: 'bunshin', kanji: '分', name: 'Kage Bunshin — Shadow Clone', lvl: 4, sign: 'tiger', color: '#ffd45c',
      sub: 'Seal both base scrolls in one day and the second one pays +50% ryō and a chakra bonus.',
      how: 'Wake Up + Wind Down, same day. The clone day also bumps the mission rank.' },
    { id: 'rasengan', kanji: '螺', name: 'Rasengan', lvl: 7, sign: 'none', color: '#7fb8ff',
      sub: 'Every 7-day chain spins a Rasengan: +120 chakra and +300 ryō on the spot.',
      how: 'Triggers on the seal that makes the streak a multiple of 7.' },
    { id: 'chidori', kanji: '雷', name: 'Chidori', lvl: 10, sign: 'ox', color: '#a9c8ff',
      sub: '極 paths pay double ryō. A thousand birds for the ones who choose the hard road.',
      how: 'Passive. Applies to Might Guy, Madara, and any path marked 極.' },
    { id: 'hiraishin', kanji: '飛', name: 'Hiraishin — Flying Raijin', lvl: 14, sign: 'snake', color: '#ffb35c',
      sub: 'Mastered paths (7+ seals) pay +40% chakra. You are marked; you arrive instantly.',
      how: 'Passive. Rewards the paths you actually keep.' },
    { id: 'sage', kanji: '仙', name: 'Sennin Mode — Sage Mode', lvl: 0, streak: 30, sign: 'none', color: '#ff9a3d',
      sub: 'Thirty unbroken days. Nature chakra gathers around the name. The village sees the aura.',
      how: 'Earned by a 30-day chain. The aura stays while the chain is 30 or more.' }
  ];

  /* ---------- sensei: chosen once, heard daily ---------- */
  G.SENSEI = [
    { id: 'kakashi', kanji: '写', name: 'Kakashi', title: 'the Copy Ninja', perk: 'paths pay +15% chakra', perkKey: 'pathChakra', acc: '#c8d0dc',
      lines: ['You were late to your own life for years. Today you are on time.', 'Those who skip the base are trash. Those who skip their friends are worse. Do both.', 'A thousand jutsu and one secret: I showed up.', 'Read the cue. Then read it again. Then do the boring thing.', 'The bell was never the point. You getting up was.', 'The mask stays on. The work stays honest.', 'Look underneath the underneath — the step you want to skip is the one you need.', 'Sorry I am late. A black cat crossed — anyway, you are here. That is the jutsu.', 'Copy the version of you that did it yesterday.', 'Talent finds the start line. Habit finds the finish.', 'If it takes two minutes, it takes zero excuses.', 'Your rival is the you who almost did it.', 'Cover the eye that watches other people.', 'Underneath the underneath is usually just: begin.'] },
    { id: 'guy', kanji: '熱', name: 'Might Guy', title: 'the Noble Blue Beast', perk: '極 paths pay +30% ryō', perkKey: 'hardRyo', acc: '#7cc76a',
      lines: ['If you cannot do it today, do it twice tomorrow — that is the rule I live by.', 'The springtime of youth is not an age. It is a decision, made every morning.', 'Talent is a rumor. Sweat is a fact.', 'A gate opens only when you push. Push.', 'A rival is a gift. Be your own, and be ruthless.', 'You are not tired. You are uncommitted. Fix the second one.', 'Run until the excuses cannot keep up.', 'One hundred seals, or five hundred laps of regret! Choose!', 'Youth! Is! A! Verb!', 'The lotus blooms twice for those who show up twice.', 'Kakashi wins coin flips. I win mornings.', 'Pain now is the receipt for pride later.', 'If your flame is small, shelter it. Do not blow it out yourself.', 'Self-rule number one: keep the promise you made at dawn.'] },
    { id: 'asuma', kanji: '煙', name: 'Asuma', title: 'of the Twelve Guardians', perk: 'all ryō +10%', perkKey: 'ryo', acc: '#e09a6b',
      lines: ['The king is the thing you are protecting. Name it. Then do the work for it.', 'A shinobi plays the long game. Today is one move.', 'Slow is fine. Stopped is the only failure.', 'Guard the small promises — they are the ones that hold the big ones up.', 'Your future self is a teammate. Stop making him carry you.', 'One more set. Then we smoke nothing and go home.', 'Discipline is just respect for someone you have not become yet.', 'Shōgi teaches this: protect the king, spend the pawns. Your king is the morning.', 'Cheap wins compound. Take the cheap win.', 'Nobody guards the village in one day. Shifts, kid. Shifts.', 'The ash falls where it falls. You still light tomorrow.', 'A blade is only as sharp as its maintenance.', 'Win the boring middle-game.', 'Debt collectors and skipped days both charge interest.'] },
    { id: 'kurenai', kanji: '紅', name: 'Kurenai', title: 'of the Crimson Eye', perk: 'breath steps earn double chakra', perkKey: 'breathChakra', acc: '#ff6a7a',
      lines: ['The illusion is that tomorrow is a better day to start. Kai. Release it.', 'Breathe like it is a technique, because it is.', 'Calm is not a mood. It is a skill you rehearse.', 'Watch the mind tell its story. Do the step anyway.', 'The quiet ones seal more days. Be quiet.', 'You do not fight the loop — you stop feeding it.', 'A genjutsu breaks the moment you name it. Name it.', 'Name the excuse out loud. Hear how thin it sounds. Kai.', 'The mind is a genjutsu artist. The body just does the step.', 'Stillness is not empty. It is loaded.', 'You survived every worst day so far. Evidence matters.', 'Slow breath, slow thoughts, sealed scroll.', 'Do not believe everything you think at 11 PM.', 'The red eye sees one truth: you came back.'] },
    { id: 'jiraiya', kanji: '蝦', name: 'Jiraiya', title: 'the Toad Sage', perk: 'logged numbers earn +5 chakra', perkKey: 'logChakra', acc: '#ff9a3d',
      lines: ['A shinobi is one who endures. Write that on the ceiling.', 'The world will give you a hundred reasons. Give it one seal.', 'Fail loudly, early, and often — then get up like it was the plan.', 'Stories are written by the ones who kept the morning.', 'Greatness is mostly attendance.', 'Go outside. The sky is a better screen.', 'The student who surpasses the teacher started by listening.', 'Chapter one is always clumsy. Write it anyway.', 'The pervy sage got one thing pure: devotion to the craft.', 'Talent is the hook. Endurance is the whole book.', 'My best student was the one who refused to stay down.', 'Research! Which today means: go do the thing and take notes.', 'Legends are just streaks with better marketing.', 'The toad oil works. So does showing up. Only one is for sale.'] },
    { id: 'iruka', kanji: '海', name: 'Iruka', title: 'of the Academy', perk: 'exams need one fewer sealed day', perkKey: 'examEase', acc: '#7fb8cc',
      lines: ['You belong here. Now prove it to yourself, not to me.', 'I am not grading your talent. I am grading whether you came.', 'The first seal is the hardest. The second is the most important.', 'Nobody is born a shinobi. Everybody is born tired.', 'Small steps, taken daily, outrun big ones taken once.', 'Being seen matters less than seeing yourself do it.', 'Ramen later. Scroll first.', 'I saved you a seat. It is still yours.', 'Class is whenever you open the scroll.', 'The demon in you is just hunger with bad manners. Feed it discipline.', 'I have graded thousands. The comeback kids all share one move: they come back.', 'Your worst day counts double if you seal it.', 'Homework: one step. Extra credit: two.', 'Ichiraku after a sealed week. That is a promise.'] }
  ];

  /* ---------- clan perks that are real (the rest are honored in text) ---------- */
  G.CLAN_PERKS = { uchiha: { chakra: 1.10 }, senju: { kawarimiMax: 3 }, uzumaki: { kawarimiEvery: 5 }, akimichi: { ryo: 1.10 }, maito: { hardChakra: 1.25 }, nara: { examEase: 1 }, hyuga: { seeAll: 1 } };

  /* ---------- the twelve hand seals ---------- */
  G.HAND_SEALS = [['子', 'Rat'], ['丑', 'Ox'], ['寅', 'Tiger'], ['卯', 'Hare'], ['辰', 'Dragon'], ['巳', 'Snake'], ['午', 'Horse'], ['未', 'Ram'], ['申', 'Monkey'], ['酉', 'Bird'], ['戌', 'Dog'], ['亥', 'Boar']];

  /* ---------- the Bingo Book: bounties on your own deeds ---------- */
  G.BOUNTIES = [
    ['first_seal', '初', 'First Blood', 'Seal a single day.', 100],
    ['seals_50', '五', 'Fifty Seals', 'Fifty scrolls sealed, lifetime.', 500],
    ['seals_200', '二', 'Two Hundred', 'Two hundred scrolls sealed.', 2000],
    ['streak_7', '七', 'Seven Nights', 'A seven-day chain.', 300],
    ['streak_30', '月', 'The Full Moon', 'A thirty-day chain.', 1500],
    ['streak_100', '百', 'Hundred Days', 'One hundred days unbroken.', 5000],
    ['clone_day', '分', 'Shadow Clone', 'Seal both base scrolls in one day.', 200],
    ['hard_path', '誠', 'The Vow Kept', 'Finish a 極 path.', 250],
    ['all_paths', '道', 'The Ten Roads', 'Seal a day on every one of the ten paths.', 800],
    ['master_1', '師', 'First Mastery', 'Seven seals on one path.', 400],
    ['grand_1', '極', 'Grandmaster', 'Thirty seals on one path.', 2000],
    ['early', '朝', 'Before the Sun', 'Seal a scroll before 7 AM.', 150],
    ['late', '夜', 'Night Watch', 'Seal a scroll after 11 PM.', 150],
    ['forge', '鍛', 'Blacksmith', 'Forge your own scroll with five or more steps.', 200],
    ['share', '契', 'The Bond', 'Share a path with someone.', 200],
    ['kit', '具', 'Full Pouch', 'Own every tool in the founder’s kit.', 600],
    ['miles_100', '走', 'Hundred Miles', 'Log one hundred miles.', 1000],
    ['rasengan', '螺', 'The Spiral', 'Spin your first Rasengan.', 300],
    ['sage', '仙', 'Nature Chakra', 'Enter Sage Mode.', 3000],
    ['level_10', '十', 'Tenth Gate', 'Reach chakra level 10.', 500],
    ['jonin_week', '完', 'The Perfect Week', 'Pass the Jōnin Trial.', 1000],
    ['akatsuki', '暁', 'Red Clouds', 'Walk the rogue path.', 100],
    ['streak_50', '半', 'Fifty Nights', 'A fifty-day chain.', 2500],
    ['seals_500', '伍', 'Five Hundred', 'Five hundred scrolls sealed.', 6000],
    ['clone_20', '影', 'Army of One', 'Twenty Shadow Clone days.', 1200],
    ['weeks_4', '四', 'The Iron Month', 'Four perfect weeks, lifetime.', 2000],
    ['level_20', '廿', 'Twentieth Gate', 'Reach chakra level 20.', 2500],
    ['summon_1', '契', 'First Contract', 'Sign your first summon.', 800],
    ['spender', '散', 'Patron of the Bazaar', 'Own ten cosmetics.', 1500],
    ['trial_3', '三', 'Thrice Tested', 'Pass three trials of the Climb.', 2000]
  ];

  /* ---------- the Kage's letters: one at enrollment, one at every promotion ---------- */
  G.LETTERS = [
    { k: '入', t: 'On your enrollment', body: 'The register has your name now. I will not pretend I know what you will become — nobody does at this desk. But I have watched this village for long enough to know what separates the ones who stay from the ones who fade: it is never talent. It is the morning. Seal one. Then we talk.' },
    { k: '忍', t: 'On your promotion to Genin', body: 'You passed the bell test. Most do not, because most think the bell is the point. You understood that the test was whether you would come back. Your headband is cloth and steel. The thing it marks is not.' },
    { k: '中', t: 'On your promotion to Chūnin', body: 'Five days of seven, in a forest that does not care. A Chūnin leads. Not because they are strongest — because they are still there on the fifth day when the plan has burned. Your scroll is a plan that survived contact. Keep it that way.' },
    { k: '特', t: 'On your special assignment', body: 'Six of seven. One miss and the week unravels; you did not miss. Tokubetsu means the village trusts you alone with one thing. Yours is obvious: the base. Guard it like a secret.' },
    { k: '上', t: 'On your promotion to Jōnin', body: 'A perfect week. I have signed a thousand of these and I still read every name twice. The village gives you an epithet now. It will follow you into rooms you have not entered yet. Earn it again tomorrow — that is the only way a name stays true.' },
    { k: '暗', t: 'On the mask', body: 'ANBU do not get this letter in public. Twelve of fourteen, unseen. The red clouds will call you now — they call everyone who is good at being alone. Choose, if you choose, with your eyes open. The record is yours either way.' },
    { k: '影', t: 'On the summit', body: 'Twenty-four of twenty-eight. There is no rank above this because there is nothing above this: a person who shows up when no one would blame them for stopping. The hat is yours. Wear it to the morning. It is the only place it has ever mattered.' }
  ];


  /* the village at dusk, unsealed: the tone sharpens */
  G.URGENT_LINES = [
    'The day is still open. Close it before it closes you.',
    'Lanterns are lit and your scroll is not. You know the order of those two.',
    'One seal. Then rest with a clean ledger.',
    'The night forgives the tired. It does not forgive the finished-nothing.',
    'You are one small ritual from keeping the promise. Go.',
    'Do not negotiate with the pillow. Seal first.'
  ];

  /* short letters for the fallen — delivered quietly to the inbox on a trial failure */
  G.FAIL_NOTES = {
    bell: { k: '鈴', t: 'The bells still hang', b: 'You went hungry today. So did I, once — three times, if we are counting. The post is not going anywhere. Neither, I suspect, are you.' },
    forest: { k: '森', t: 'From the tower you did not reach', b: 'The forest keeps a ledger of everyone it takes. It also keeps the gate open. Fourteen days. Sharpen something.' },
    spec: { k: '特', t: 'On the discipline', b: 'A specialty is not chosen in a week. Keep the track. The kanji waits for the work.' },
    jonin: { k: '上', t: 'On the fourteen days', b: 'Complete means complete. You know exactly which day it was. That day is your whole curriculum now.' },
    anbu: { k: '暗', t: 'A burned mask', b: 'Root does not return masks. It returns people, occasionally, improved. Twenty-one days in the light — then choose a new face.' },
    kage: { k: '頂', t: 'The empty chair', b: 'Every Kage on the rock failed something first. The mountain does not record attempts. It records the last one.' }
  };

  G.MISSION_KANJI = { D: '丁', C: '丙', B: '乙', A: '甲', S: '秀' };
})((typeof window !== 'undefined' ? window : global).HOKAGE = (typeof window !== 'undefined' ? window : global).HOKAGE || {});
