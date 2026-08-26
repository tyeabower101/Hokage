/* HOKAGE — data: the world (villages, clans, the ten paths, the archive, the base scrolls). */
(function (G) {
  'use strict';
  G.VILLAGES = {
    konoha: { kanji: '木', name: 'Konohagakure', en: 'Hidden Leaf', kage: 'Hokage', vibe: 'the will of fire', acc: '#ff8f4d', glow: '#ffb35c', sky: ['#2b1a3d', '#c65b3c'], nature: 'fire' },
    suna: { kanji: '砂', name: 'Sunagakure', en: 'Hidden Sand', kage: 'Kazekage', vibe: 'patience of the dunes', acc: '#e8b45a', glow: '#ffd27a', sky: ['#3d1f4d', '#d8574a'], nature: 'wind' },
    kiri: { kanji: '霧', name: 'Kirigakure', en: 'Hidden Mist', kage: 'Mizukage', vibe: 'calm in the grey', acc: '#7fb8cc', glow: '#c9dae0', sky: ['#2a3345', '#6b7f94'], nature: 'water' },
    kumo: { kanji: '雲', name: 'Kumogakure', en: 'Hidden Cloud', kage: 'Raikage', vibe: 'thunder held back', acc: '#e09a6b', glow: '#f2b88f', sky: ['#241d40', '#6b3d5c'], nature: 'lightning' },
    iwa: { kanji: '岩', name: 'Iwagakure', en: 'Hidden Stone', kage: 'Tsuchikage', vibe: 'the unmoved mountain', acc: '#cc9a66', glow: '#f2b87a', sky: ['#2e2418', '#8a5a38'], nature: 'earth' },
    ame: { kanji: '雨', name: 'Amegakure', en: 'Hidden Rain', kage: 'Village Head', vibe: 'discipline in the downpour', acc: '#5c7d94', glow: '#a8c4d4', sky: ['#161d2b', '#3a4a5c'], nature: 'water' },
    taki: { kanji: '滝', name: 'Takigakure', en: 'Hidden Waterfall', kage: 'Village Head', vibe: 'relentless as falling water', acc: '#9cc98a', glow: '#d8eab8', sky: ['#1c2e24', '#4a7a52'], nature: 'water' },
    kusa: { kanji: '草', name: 'Kusagakure', en: 'Hidden Grass', kage: 'Village Head', vibe: 'quiet growth', acc: '#d8c070', glow: '#ffe0a3', sky: ['#242a14', '#6b7a3d'], nature: 'earth' },
    oto: { kanji: '音', name: 'Otogakure', en: 'Hidden Sound', kage: 'Village Head', vibe: 'the note others miss', acc: '#b06be0', glow: '#c47ae0', sky: ['#1d1430', '#4a2a6b'], nature: 'lightning' },
    yu: { kanji: '湯', name: 'Yugakure', en: 'Hidden Hot Water', kage: 'Village Head', vibe: 'ease earned daily', acc: '#e8a878', glow: '#ffcc9c', sky: ['#2e1d1d', '#8a4a3d'], nature: 'fire' },
    shimo: { kanji: '霜', name: 'Shimogakure', en: 'Hidden Frost', kage: 'Village Head', vibe: 'clarity of cold', acc: '#9d8fd4', glow: '#d4c8f2', sky: ['#181a2e', '#3d4470'], nature: 'water' },
    hoshi: { kanji: '星', name: 'Hoshigakure', en: 'Hidden Star', kage: 'Village Head', vibe: 'trained under a falling star', acc: '#a880f0', glow: '#c9a3ff', sky: ['#120f26', '#3a2a6b'], nature: 'wind' }
  };
  G.RANKS = [['Academy Student', 0], ['Genin', 10], ['Chūnin', 60], ['Tokubetsu Jōnin', 150], ['Jōnin', 300], ['ANBU', 550], ['Kage', 900]];
  /* [id, name, tier, perk] · tiers: legendary > rare > noble > common */
  G.CLANS = [
    ['uchiha', 'Uchiha', 'legendary', 'Eyes that copy — you learn by watching once.'],
    ['senju', 'Senju', 'legendary', 'Vitality of the forest — you recover faster than most.'],
    ['uzumaki', 'Uzumaki', 'legendary', 'The sealing blood of Uzushiogakure — your chains outlast everything.'],
    ['hyuga', 'Hyūga', 'rare', 'The all-seeing eye — nothing on the scroll escapes you.'],
    ['kaguya', 'Kaguya', 'rare', 'Bone of the moon — an unbreakable frame.'],
    ['hatake', 'Hatake', 'rare', 'The white fang’s line — mastery of a thousand small skills.'],
    ['nara', 'Nara', 'noble', 'Shadow tactician — you plan before you move.'],
    ['yamanaka', 'Yamanaka', 'noble', 'Mind-walker — you understand what drives people.'],
    ['aburame', 'Aburame', 'noble', 'A quiet swarm — a hundred small habits, one force.'],
    ['akimichi', 'Akimichi', 'noble', 'Strength of appetite — power through fuel.'],
    ['inuzuka', 'Inuzuka', 'noble', 'Feral loyalty — you never train alone in spirit.'],
    ['sarutobi', 'Sarutobi', 'noble', 'The Professor’s line — every jutsu is learnable.'],
    ['maito', 'Maito', 'common', 'No bloodline. No limit. Effort is the kekkei genkai.'],
    ['umino', 'Umino', 'common', 'The steady tide — patience that outlasts talent.'],
    ['haruno', 'Haruno', 'common', 'Civilian blood, iron will — you were not given anything.'],
    ['shiranui', 'Shiranui', 'common', 'A senbon between the teeth — calm under anything.']
  ];
  G.TIER_ODDS = [['legendary', 4], ['rare', 12], ['noble', 34], ['common', 50]];
  G.CLAN_EMBLEMS = {
    uchiha: '<path d="M12 3a8.5 8.5 0 0 1 8.5 8.5H3.5A8.5 8.5 0 0 1 12 3z" fill="#c9312b"/><path d="M3.5 11.5h17a8.5 8.5 0 0 1-6 7.5v2.5h-5V19a8.5 8.5 0 0 1-6-7.5z" fill="#f2ede4"/>',
    senju: '<path d="M12 3v18M6 8c2 2 4 2 6 0 2 2 4 2 6 0M6 14c2 2 4 2 6 0 2 2 4 2 6 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    uzumaki: '<path d="M12 12m-1 0a1 1 0 1 0 2 0 3 3 0 1 1-6 0 5 5 0 1 0 10 0 7 7 0 1 1-14 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    hyuga: '<ellipse cx="12" cy="12" rx="9" ry="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    kaguya: '<path d="M6 6l12 12M18 6L6 18" stroke="#f2ede4" stroke-width="2.6" stroke-linecap="round"/><circle cx="6" cy="6" r="2" fill="#f2ede4"/><circle cx="18" cy="6" r="2" fill="#f2ede4"/><circle cx="6" cy="18" r="2" fill="#f2ede4"/><circle cx="18" cy="18" r="2" fill="#f2ede4"/>',
    hatake: '<path d="M13 3L6 13h5l-2 8 8-11h-5l1-7z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    nara: '<path d="M12 21V9M12 9L7 4M12 9l5-5M9 6.5 7 7M15 6.5 17 7M12 13H8M12 16h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    yamanaka: '<circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.8 2.8M14.7 14.7l2.8 2.8M17.5 6.5l-2.8 2.8M9.3 14.7l-2.8 2.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    aburame: '<circle cx="12" cy="8" r="2.2" fill="currentColor"/><circle cx="8" cy="13" r="2.2" fill="currentColor"/><circle cx="16" cy="13" r="2.2" fill="currentColor"/><circle cx="12" cy="18" r="2.2" fill="currentColor"/>',
    akimichi: '<circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 12h7M12 8.5v7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    inuzuka: '<path d="M8 4l2.5 8L8 20M16 4l-2.5 8L16 20" fill="none" stroke="#c9312b" stroke-width="2.4" stroke-linecap="round"/>',
    sarutobi: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 7c2.5 1.5 2.5 4-0 5 2.5 1 2.5 3.5 0 5-2.5-1.5-2.5-4 0-5-2.5-1-2.5-3.5 0-5z" fill="currentColor"/>',
    maito: '<circle cx="12" cy="13" r="6.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 13a6.5 6.5 0 0 1 13 0" fill="currentColor" opacity=".5"/><path d="M12 3v3M7 5l1.6 2M17 5l-1.6 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    umino: '<path d="M3 10c3-3 6 3 9 0s6 3 9 0M3 16c3-3 6 3 9 0s6 3 9 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    haruno: '<circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="2.2"/>',
    shiranui: '<path d="M4 12h16M17 12l-3-2M17 12l-3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  G.EPITHETS = {
    fire: ['Ember That Doesn\u2019t Sleep', 'Second Sunrise', 'Unbroken Flame', 'Quiet Furnace'],
    wind: ['Wind That Returns', 'Patient Storm', 'Standing Gale', 'Unmoved Sky'],
    water: ['Tide That Keeps Time', 'Still Deep', 'Returning Rain', 'Unbroken Current'],
    lightning: ['Held Thunder', 'Slow Lightning', 'Steady Storm', 'Charge That Waits'],
    earth: ['Mountain\u2019s Habit', 'Unmoved Stone', 'Deep Root', 'Patient Bedrock']
  };
  G.DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  G.MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  G.TYPES = { open: ['◇', 'Stamp'], timed: ['◷', 'Timer'], reps: ['×', 'Reps'], breath: ['◌', 'Breath'], path: ['⛩', 'Path'], section: ['—', 'Section'] };

  /* ---------- the founder's kit ---------- */
  G.KIT = [
    ['e_clnz', 'Face cleanser', 'skin', 'CeraVe Foaming Facial Cleanser', 13],
    ['e_bp', 'Acne wash (BP)', 'skin', 'PanOxyl 4% Acne Creamy Wash', 12],
    ['e_ret', 'Retinoid', 'skin', 'Differin Adapalene Gel 0.1%', 15],
    ['e_moist', 'Night moisturizer', 'skin', 'CeraVe PM Facial Moisturizing Lotion', 17],
    ['e_spf', 'Face sunscreen', 'skin', 'EltaMD UV Clear SPF 46', 43],
    ['e_lip', 'SPF lip balm', 'skin', 'Sun Bum SPF 30 Lip Balm', 5],
    ['e_keto', 'Ketoconazole shampoo', 'hair', 'Nizoral Anti-Dandruff Shampoo 1%', 16],
    ['e_shmp', 'Gentle shampoo', 'hair', 'Free & Clear Shampoo', 12],
    ['e_cond', 'Conditioner', 'hair', 'Free & Clear Conditioner', 12],
    ['e_minox', 'Minoxidil 5% foam', 'hair', 'Rogaine Men\u2019s 5% Minoxidil Foam', 45],
    ['e_stamp', 'Derma stamp 0.5mm', 'hair', '0.5mm Titanium Derma Stamp', 12],
    ['e_floss', 'Floss picks', 'oral', 'Plackers Micro Mint Floss Picks', 6],
    ['e_paste', 'Toothpaste', 'oral', 'Sensodyne Pronamel Toothpaste', 7]
  ];
  G.CATS = [['skin', '肌', 'Skin'], ['hair', '髪', 'Hair'], ['oral', '歯', 'Oral'], ['body', '体', 'Body'], ['gear', '具', 'Gear']];
  G.SHELF = { skin: ['Body lotion', 'Spot treatment', 'Aftershave'], hair: ['Hair oil', 'Curl cream', 'Sea-salt spray'], oral: ['Tongue scraper', 'Mouthwash', 'Whitening strips'], body: ['Deodorant', 'Body wash', 'Cologne'], gear: ['Foam roller', 'Lacrosse ball', 'Resistance band', 'Pull-up bar', 'Journal'] };

  /* ---------- step builder ---------- */
  function S(n, cue, ex) { return Object.assign({ name: n, cue: cue, type: 'open', secs: 0, reps: 10 }, ex || {}); }
  G.mkStep = S;

  /* ---------- the ten character paths [kanji,name,tag,slot,steps,hard,accent,sign] ---------- */
  G.PATHS = [
    ['門', 'Rock Lee — The Eight Gates', 'the hard, honest wake-up', 'am', [
      S('Gate stance', 'Feet set, fists at the ribs, one long breath. Announce the work to your body.', { type: 'timed', secs: 20 }),
      S('Jumping jacks', 'Light and springy — raise the engine temperature.', { type: 'timed', secs: 45 }),
      S('Arm circles', 'Small to large, both directions.', { type: 'timed', secs: 30 }),
      S('Leg swings', 'Front-back and side-side, holding the wall.', { type: 'timed', secs: 45 }),
      S('第一 Gate of Opening — push-ups', 'Chest to floor. The first gate is showing up.', { type: 'reps', reps: 20 }),
      S('第二 Gate of Healing — squats', 'Below parallel, heels down.', { type: 'reps', reps: 25 }),
      S('第三 Gate of Life — lunges', 'Alternating, knee kisses the floor.', { type: 'reps', reps: 20 }),
      S('第四 Gate of Pain — plank', 'Ribs down, glutes on, breathe through it.', { type: 'timed', secs: 60 }),
      S('第五 Gate of Limit — burpees', 'Full chest to floor, full jump.', { type: 'reps', reps: 10 }),
      S('第六 Gate of View — mountain climbers', 'Fast feet, hips low.', { type: 'timed', secs: 40 }),
      S('第七 Gate of Wonder — wall sit', 'Thighs parallel, back flat, hands off.', { type: 'timed', secs: 60 }),
      S('第八 Gate of Death — hollow hold', 'Low back welded down. The last gate costs.', { type: 'timed', secs: 45 }),
      S('Dead hang', 'Grip, breathe, decompress.', { type: 'timed', secs: 30 }),
      S('Shake down', 'Loose limbs, tall spine.', { type: 'timed', secs: 30 }),
      S('The vow', 'One line out loud: what today\u2019s effort buys. If you cannot do it, add a set tomorrow.', {}),
      S('Water', 'The whole glass before anything else happens.', {})
    ], 0, '#7cc76a'],
    ['誠', 'Might Guy — The Vow of Dawn', 'the hardest path \u00b7 callous the mind', 'pm2am', [
      S('Rise on the first alarm', 'Feet on the floor before the snooze exists. The vow starts here.', {}),
      S('Cold finish', 'End the rinse cold for thirty seconds. When it bites, ten more seconds.', { type: 'timed', secs: 30 }),
      S('Sprint 1', 'All out, twenty seconds.', { type: 'timed', secs: 20 }), S('Walk back', 'Nose breathing.', { type: 'timed', secs: 60 }),
      S('Sprint 2', 'All out.', { type: 'timed', secs: 20 }), S('Walk back', 'Recover.', { type: 'timed', secs: 60 }),
      S('Sprint 3', 'All out.', { type: 'timed', secs: 20 }), S('Walk back', 'Recover.', { type: 'timed', secs: 60 }),
      S('Sprint 4', 'All out.', { type: 'timed', secs: 20 }), S('Walk back', 'Recover.', { type: 'timed', secs: 60 }),
      S('Sprint 5', 'All out.', { type: 'timed', secs: 20 }), S('Walk back', 'Recover.', { type: 'timed', secs: 60 }),
      S('Sprint 6', 'The one that counts.', { type: 'timed', secs: 20 }), S('Walk back', 'Recover.', { type: 'timed', secs: 90 }),
      S('Push-ups to form failure', 'Stop one rep before the form breaks — not one after.', { type: 'reps', reps: 1 }),
      S('Squats to form failure', 'Same law below.', { type: 'reps', reps: 1 }),
      S('Hollow hold', 'Forty-five seconds of honesty.', { type: 'timed', secs: 45 }),
      S('Side plank', 'The chime flips you.', { type: 'timed', secs: 30, sides: 1 }),
      S('Superman hold', 'Chest and thighs off the floor.', { type: 'timed', secs: 30 }),
      S('Calf raises', 'Slow up, slower down.', { type: 'reps', reps: 25 }),
      S('Pike push-ups', 'Hips high, head to floor.', { type: 'reps', reps: 10 }),
      S('Reverse lunges', 'Alternating, controlled.', { type: 'reps', reps: 20 }),
      S('Second wind sprint', 'One more. For the mirror.', { type: 'timed', secs: 20 }),
      S('Mirror vow', 'Eyes on your own eyes: \u201cIf I cannot keep this vow, I will do it again tomorrow, harder.\u201d', {}),
      S('Youth stretch', 'Reach for the sun, whole body.', { type: 'timed', secs: 30 }),
      S('Fists to the sky', 'Ten slow punches upward, full intent.', { type: 'reps', reps: 10 }),
      S('Gratitude, loudly', 'One thing, said out loud, no mumbling.', {}),
      S('Water \u00b7 the whole glass', 'The body paid; refill it.', {}),
      S('Log the vow kept', 'Mark it. The record is the rival.', {})
    ], 1, '#ff7a3d'],
    ['黄', 'Minato — The Marked Morning', 'strike before the noise', 'am', [
      S('Mark the target', 'Write the single task that would make today a win.', { type: 'timed', secs: 60 }),
      S('Clear the field', 'Phone in another room, tabs closed, one document open.', {}),
      S('Water and posture', 'Full glass, sit tall.', {}),
      S('Flying Raijin — strike one', 'Twenty focused minutes on the mark. Nothing else exists.', { type: 'timed', secs: 1200 }),
      S('Kunai down', 'Stand, shake out, water. Three minutes, no screens.', { type: 'timed', secs: 180 }),
      S('Strike two', 'Twenty-five more. Finish the cut.', { type: 'timed', secs: 1500 }),
      S('Seal the progress', 'One line: what moved, what\u2019s next. Future-you reads this.', { type: 'timed', secs: 60 }),
      S('Step outside', 'Two minutes of sky. The mark is struck.', { type: 'timed', secs: 120 })
    ], 0, '#ffd45c'],
    ['白', 'Neji — Byakugan Dawn', 'posture, eyes, one certainty', 'am', [
      S('Sit — see everything', 'Two minutes, eyes soft, notice the room in 360\u00b0. Arrive.', { type: 'timed', secs: 120 }),
      S('Chin tucks', 'Five slow, two-second holds.', { type: 'reps', reps: 5 }),
      S('Wall angels', 'Back flat to the wall, arms sliding.', { type: 'reps', reps: 10 }),
      S('Doorway pec stretch', 'Step through, chest open.', { type: 'timed', secs: 45 }),
      S('20/20/20 eye drill', 'Twenty seconds each: near, mid, far out a window.', { type: 'timed', secs: 60 }),
      S('Palming', 'Warm palms over closed eyes, darkness, breathe.', { type: 'timed', secs: 60 }),
      S('Eight-point scan', 'Trace the room\u2019s corners with the eyes only, head still.', { type: 'timed', secs: 45 }),
      S('One certainty', 'Write the one thing you know is true about today. Fate is a schedule.', { type: 'timed', secs: 60 }),
      S('Stand — taller than yesterday', 'Set the shoulders. Leave.', {})
    ], 0, '#cfd6ff'],
    ['閃', 'Sasuke — Lightning Dawn', 'eyes, engine, and the road', 'am', [
      S('Box breathing', 'In 4, hold 4, out 4, hold 4. Follow the ring.', { type: 'breath', breath: [4, 4, 4, 4, 4] }),
      S('Neck rolls', 'Slow half-circles, ear to ear across the chest. Never force the back arc.', { type: 'timed', secs: 45 }),
      S('Cat–cow', 'Inhale as the belly drops, exhale as the spine rounds. Breath drives the spine.', { type: 'timed', secs: 60 }),
      S('Standing overhead reach', 'Fingers laced, palms to the ceiling, ribs tall. Long exhale up.', { type: 'timed', secs: 30 }),
      S('Kneeling wrist rocks', 'Palms down, fingers toward you. Rock back until the forearms bite. Mouse wrists, mat wrists — same wrists.', { type: 'timed', secs: 45 }),
      S('Standing hip circles', 'Hands on hips, big slow circles both ways. Grease, don\u2019t stretch.', { type: 'timed', secs: 45 }),
      S('90/90 hip switches', 'Knees sweep side to side, chest tall. Both hips staying down is the work.', { type: 'timed', secs: 60 }),
      S('Banded shoulder dislocates', 'Wide grip, straight arms, over and behind. Widen the grip before you ever bend the elbows.', { type: 'reps', reps: 10 }),
      S('Dead hang', 'Full grip, shoulders relaxed, nasal breathing. Last in the block — shoulders warm.', { type: 'timed', secs: 45 }),
      S('Couch stretch', 'Rear foot up the wall, glute ON, torso tall. The chime flips your side.', { type: 'timed', secs: 120, sides: 1 }),
      S('Deep squat hold', 'Heels down, elbows pry the knees, chest proud. Sit in the bottom and breathe.', { type: 'timed', secs: 60 }),
      S('Kegels + reverse kegels', 'Straight out of the squat — the floor is released. 3s squeeze-and-lift ×10, then belly-breathe it open ×10.', { type: 'reps', reps: 10 }),
      S('Glute bridges', 'Drive the heels, squeeze two seconds at the top, ribs down. Wake the engine.', { type: 'reps', reps: 15 }),
      S('Dead bug', 'Low back welded to the floor. Opposite arm and leg, slow. If the back arches, the rep didn\u2019t count.', { type: 'reps', reps: 10 }),
      S('World\u2019s greatest stretch', 'Lunge, elbow to instep, rotate and reach. Alternate sides — flow, don\u2019t hold.', { type: 'timed', secs: 60 }),
      S('拳 Push-up century', 'One hundred: 25 per tap, four taps. Chest to floor, elbows ~45°. A set breaks? Finish the rung on knees — the hundred gets paid.', { type: 'reps', reps: 4 }),
      S('脚 Squat century', 'One hundred: 25 per tap, four taps. Below parallel, heels down, no bouncing out of the hole.', { type: 'reps', reps: 4 }),
      S('芯 Core gauntlet', '60s hollow hold straight into 15 slow leg raises — low back pinned for BOTH. One tap when done.', { type: 'timed', secs: 90 }),
      S('A-skips', 'Tall, springy, knees driving. You are priming the run.', { type: 'timed', secs: 30 }),
      S('Pogo hops', 'Stiff ankles, fast ground contact, quiet landings.', { type: 'timed', secs: 30 }),
      S('走 The Run', 'Out the door. The path ends where the road does — log the miles when you\u2019re back.', { log: 'mi' })
    ], 0, '#8f7ce8'],
    ['覇', 'Madara — The Reckoning', 'the hardest night \u00b7 no excuses survive', 'pm', [
      S('Face the ledger', 'Open the day. What was promised, what was delivered. No commentary.', { type: 'timed', secs: 120 }),
      S('The debt', 'Every promise broken today costs ten push-ups. Pay now.', { type: 'reps', reps: 10 }),
      S('Wall sit — hold court', 'While you hold, name tomorrow\u2019s three moves out loud.', { type: 'timed', secs: 90 }),
      S('Iron neck', 'Palm-resisted isometrics, four directions.', { type: 'timed', secs: 60 }),
      S('The purge', 'Delete one app, unfollow one account, or clear one drawer. Weakness leaves tonight.', { type: 'timed', secs: 180 }),
      S('Plank of the ancestors', 'Side plank each arm. The chime flips you.', { type: 'timed', secs: 45, sides: 1 }),
      S('Declare tomorrow', 'One sentence, written like an order. Sleep is the armory.', { type: 'timed', secs: 60 })
    ], 1, '#ff4d4d'],
    ['砂', 'Gaara — Night Watch', 'for the ones sleep avoids', 'pm', [
      S('The gourd empties', 'Brain-dump every open loop onto paper. All of it.', { type: 'timed', secs: 180 }),
      S('Lay out tomorrow', 'Clothes, bag, water — the sand settles.', {}),
      S('Clock faces the wall', 'You will not negotiate with numbers tonight.', {}),
      S('Cool the desert', 'Room to 65–68°F, blackout, silence.', {}),
      S('Ground contact', 'Lie flat, feel every touchpoint, ten slow breaths.', { type: 'timed', secs: 60 }),
      S('Body scan', 'Feet to crown, unclenching each station.', { type: 'timed', secs: 180 }),
      S('The stillness rule', 'In bed: rest is the job, sleep is a side effect. No checking, no counting.', {}),
      S('Bed is for sleep only', 'Cannot sleep in 20? Sit in dim light till drowsy, then return. Teach the bed one thing.', {})
    ], 0, '#e8b45a'],
    ['医', 'Tsunade — The Healer\u2019s Round', 'recovery \u00b7 for the heavy days', 'pm', [
      S('Damage report', 'Thirty seconds: what hurts, what\u2019s tight, what\u2019s tired.', { type: 'timed', secs: 30 }),
      S('Legs up the wall', 'Hips close, arms wide, jaw loose.', { type: 'timed', secs: 300 }),
      S('Slow belly breathing', 'Hand on the stomach; only the hand rises.', { type: 'breath', breath: [4, 0, 6, 0, 10] }),
      S('Self-massage', 'Ball or hands on today\u2019s report. Slow.', { type: 'timed', secs: 240 }),
      S('Warm rinse', 'Two minutes of heat on the tight spots.', { type: 'timed', secs: 120 }),
      S('Early lights', 'Tonight, sleep is the prescription. Fifteen minutes earlier than usual.', {})
    ], 0, '#6fd6b0'],
    ['幻', 'Itachi — Release the Genjutsu', 'for the mind that will not stop', 'pm', [
      S('解 Kai — name the illusion', 'Write the thought that\u2019s looping. Seeing it is releasing it.', { type: 'timed', secs: 120 }),
      S('Name three true things', 'Three facts from today. Reality outranks the loop.', { type: 'timed', secs: 60 }),
      S('Cut the feed', 'Every screen off. The genjutsu needs a channel; close it.', {}),
      S('Paper over glass', 'Ten minutes with a physical book. Any book.', { type: 'timed', secs: 600 }),
      S('One kindness noted', 'Someone\u2019s, or yours. The crow remembers.', { type: 'timed', secs: 60 })
    ], 0, '#c77cff'],
    ['蛇', 'Orochimaru — The Serpent\u2019s Lab', 'condition the vessel \u00b7 blood, frame, face, floor', 'pm', [
      S('Assess the vessel', 'Thirty seconds: what is tight from today? The ball and roller go there first.', { type: 'timed', secs: 30 }),
      S('Foam rolling — legs', 'Quads, glutes, calves. Slow passes; park and breathe on anything tender.', { type: 'timed', secs: 90 }),
      S('Frog stretch', 'Knees wide, hips sink back, forearms down. Exhale into it — never bounce.', { type: 'timed', secs: 90 }),
      S('Pigeon pose', 'Shin forward, hips square, chest melts down. The chime flips your side.', { type: 'timed', secs: 120, sides: 1 }),
      S('Half-kneeling hip flexor stretch', 'Rear glute ON, arm reaching tall and slightly over. This is the stand-taller one.', { type: 'timed', secs: 120, sides: 1 }),
      S('Doorway pec + chin tucks', 'Forearms on the frame, step through — 60s. Then five slow chin tucks, 2s holds.', { type: 'timed', secs: 90 }),
      S('Kegels — slow holds', '5s squeeze-and-lift, 5s FULL release — the release is half the rep. Breathe through all ten.', { type: 'reps', reps: 10 }),
      S('Reverse kegels — deep squat', 'Sit in the bottom, belly-breathe the floor open and down. The half athletes skip.', { type: 'timed', secs: 90 }),
      S('4-way neck isometrics', 'Palm resists forehead, back, each side — 5s pushes, about three per direction. The neck frames the jaw.', { type: 'timed', secs: 90 }),
      S('Standardized scalp massage', 'Fingertips, firm slow circles, the whole scalp. Gentle over the itchy zones.', { type: 'timed', secs: 240 }),
      S('Masseter release + rest posture', 'Knuckles in slow circles on the jaw corners. Finish: tongue on the palate, lips closed, teeth apart, nasal breathing.', { type: 'timed', secs: 60 }),
      S('Cheek lifters', 'Smile the cheeks upward, fingers resisting lightly — ten reps, 5s holds.', { type: 'reps', reps: 10 }),
      S('Resisted jaw openings', 'Fist under the chin, open against it — 5s pushes. Builds the jaw-to-neck angle without feeding a clench.', { type: 'reps', reps: 10 })
    ], 0, '#9dd464']
  ];

  /* the eleventh path: unlocked the day the rock is carved */
  G.PATHS.push(['\u516d', 'The Six Paths Vigil', 'the Kage\u2019s own scroll \u00b7 all six disciplines, one sitting', 'pm2am', [
    { name: 'The seat', cue: 'Sit on the floor. Nothing in your hands. One minute before anything begins.', type: 'timed', secs: 60 },
    { name: 'Tend\u014d \u2014 stillness', cue: 'Box breath. The Deva path bends gravity; you bend nothing but the breath.', type: 'breath', breath: [4, 4, 4, 4, 8] },
    { name: 'Shurad\u014d \u2014 the machine', cue: 'Push-ups, strict, to two short of failure. The Asura path is the body as a weapon.', type: 'reps', reps: 20 },
    { name: 'Shurad\u014d \u2014 the frame', cue: 'Plank. Elbows. No sag. The machine does not negotiate.', type: 'timed', secs: 120 },
    { name: 'Ningend\u014d \u2014 the reading', cue: 'Ten minutes with a physical book. The Human path reads souls; start with pages.', type: 'timed', secs: 600 },
    { name: 'Chikush\u014dd\u014d \u2014 the summons', cue: 'Deep squat hold. Call the body up from the floor.', type: 'timed', secs: 60 },
    { name: 'Chikush\u014dd\u014d \u2014 the count', cue: 'Twenty squats, three seconds down on each.', type: 'reps', reps: 20 },
    { name: 'Gakid\u014d \u2014 the hunger', cue: 'Fill the largest glass you own with water. Drink all of it. Nothing else enters tonight.', type: 'open' },
    { name: 'Jigokud\u014d \u2014 the judgement', cue: 'Write three honest lines about today: what held, what broke, what you owe tomorrow.', type: 'timed', secs: 240, log: 'lines' },
    { name: 'Ged\u014d \u2014 the release', cue: 'Lights off. Long exhale ladder \u2014 the last breath is the seal.', type: 'breath', breath: [4, 0, 8, 0, 6] }
  ], 'S', '#b9a3ff', 10]);


  G.SIGNS = [
    '<path d="M7 4h10M6 8h12M8 8v11M16 8v11M10 12h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    '<path d="M12 3c3 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3.4 2.4-5C10.4 8.6 11 10 12 10c0-3-1-4.5 0-7z" fill="currentColor"/>',
    '<path d="M13 3L6 13h5l-2 8 8-11h-5l1-7z" fill="currentColor"/>',
    '<ellipse cx="12" cy="12" rx="9" ry="5.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/>',
    '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="6.9" r="1.5" fill="currentColor"/><circle cx="7.6" cy="14.6" r="1.5" fill="currentColor"/><circle cx="16.4" cy="14.6" r="1.5" fill="currentColor"/>',
    '<path d="M12 3l2 5 5-1-3 5 3 5-5-1-2 5-2-5-5 1 3-5-3-5 5 1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    '<path d="M8 4c5 1 9 5 9 10 0 4-3 6-6 6s-5-2-5-5c0-4 3-5 5-7-2 0-5-1-3-4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    '<path d="M12 4l5 8-5 8-5-8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    '<path d="M12 5.5A4.6 4.6 0 1 1 7.4 10.1Q7.4 15.5 12.6 18.5 9.5 14.5 10.5 11.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="9.4" r="1.5" fill="currentColor"/>',
    '<path d="M6 18.5Q4.5 15.5 7.5 14.5 11 13.5 10 10.5 9 7.5 12.5 6 15.5 4.8 17.5 6.5M17.5 6.5Q19 7.8 17.8 9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="16.6" cy="7" r=".7" fill="currentColor"/>'
  ];

  /* ---------- the archive library ---------- */
  G.LIB = [
    ['体 Body', [
      S('Dead hang', 'Grip, relax the shoulders, breathe.', { type: 'timed', secs: 45 }),
      S('Push-ups', 'Chest to floor, elbows ~45°.', { type: 'reps', reps: 20 }),
      S('Squats', 'Below parallel, heels down.', { type: 'reps', reps: 25 }),
      S('Plank', 'Ribs down, glutes on.', { type: 'timed', secs: 60 }),
      S('Couch stretch', 'Rear foot up the wall, glute tight.', { type: 'timed', secs: 90, sides: 1 }),
      S('Deep squat hold', 'Sit in the bottom and breathe.', { type: 'timed', secs: 60 }),
      S('Glute bridges', 'Two-second squeeze at the top.', { type: 'reps', reps: 15 }),
      S('Kegels + reverse', 'Squeeze-lift ×10, then release ×10.', { type: 'reps', reps: 10 }),
      S('Neck isometrics', 'Four directions, palm-resisted.', { type: 'timed', secs: 60 }),
      S('Foam rolling', 'Slow passes where today landed.', { type: 'timed', secs: 90 })
    ]],
    ['肌 Skin & Hair', [
      S('Cleanse', '30 sec, fingertips, lukewarm, pat dry.', { dogu: 'e_clnz' }),
      S('SPF — two fingers', 'Face, ears, neck. Every morning.', { dogu: 'e_spf' }),
      S('BP shower wash', 'PanOxyl on face + trunk, sit 60–90s, rinse. White towel.', { dogu: 'e_bp' }),
      S('Adapalene — one pea', 'Bone-dry face; dodge eyes and creases.', { dogu: 'e_ret' }),
      S('Moisturize', 'Quarter-size, generous.', { dogu: 'e_moist' }),
      S('Keto dwell — 5 min', 'Nizoral sits five full minutes.', { type: 'timed', secs: 300, dogu: 'e_keto' }),
      S('Minoxidil', 'Half cap of foam, dry scalp, wash hands.', { dogu: 'e_minox' }),
      S('Scalp massage', 'Four minutes, firm slow circles.', { type: 'timed', secs: 240 }),
      S('Derma stamp', '0.5mm, light presses, no dragging.', { dogu: 'e_stamp' })
    ]],
    ['心 Mind & Sleep', [
      S('Box breathing', 'In 4, hold 4, out 4, hold 4.', { type: 'breath', breath: [4, 4, 4, 4, 4] }),
      S('4-7-8 wind-down', 'Long exhales end the day.', { type: 'breath', breath: [4, 7, 8, 0, 4] }),
      S('Three targets', 'Written, visible, ordered.', { type: 'timed', secs: 120 }),
      S('Journal — three lines', 'What happened, what mattered, what\u2019s next.', { type: 'timed', secs: 120 }),
      S('Read paper', 'Ten minutes, physical book.', { type: 'timed', secs: 600 }),
      S('Brain dump', 'Every open loop onto paper.', { type: 'timed', secs: 180 }),
      S('Ten minutes of daylight', 'Outside, no sunglasses.', { type: 'timed', secs: 600 }),
      S('Phone exiled', 'It charges in another room.', {})
    ]],
    ['歯 Oral', [
      S('Floss first', 'C-shape, below the gumline.', { dogu: 'e_floss' }),
      S('Brush — two minutes', 'Then spit, don\u2019t rinse.', { type: 'timed', secs: 120, dogu: 'e_paste' }),
      S('Tongue scrape', 'Back to front, rinse the tool.', {})
    ]]
  ];

  /* ---------- Eli's base scrolls ---------- */
  G.baseProtocols = function () {
    function id() { return 'b' + Math.random().toString(36).slice(2, 9); }
    function W(n, cue, ex) { var m = S(n, cue, ex); m.id = id(); return m; }
    return {
      asageiko: {
        id: 'asageiko', name: 'Wake Up', kanji: '朝', en: 'The morning base', mode: 'mission', builtin: true, schedule: 'am', movements: [
          W('Anchor — feet on the floor', 'Same wake time ±30 minutes, weekends included. The anchor sets every clock behind your eyes.'),
          W('Lights on · big water', 'Brightest light the second you sit up, then the full glass. Light ends the night.'),
          W('Ten minutes of daylight', 'Outside, no sunglasses, within the first hour. Morning light sets today\u2019s energy and tonight\u2019s sleep.'),
          W('Shake out sixty seconds', 'Neck, arms, tall reach — enough to tell the body the night is over.', { type: 'timed', secs: 60 }),
          W('Choose the path', 'Your character path runs here. No time today? Skip it and keep the chain.', { type: 'path' }),
          W('Cleanse — CeraVe Foaming', 'Thirty seconds, fingertips, lukewarm, pat dry. Stripping oily skin makes it oilier — gentle is the aggressive move.', { dogu: 'e_clnz' }),
          W('SPF — EltaMD, two fingers', 'Two full finger-lengths: face, ears, neck. Sunscreen is what stops your red marks from staining in.', { dogu: 'e_spf' }),
          W('Lip — SPF balm', 'One pass. Lips burn first and lie about it.', { dogu: 'e_lip' }),
          W('Brush — two full minutes', 'Every surface, then spit — don\u2019t rinse. The film keeps working.', { type: 'timed', secs: 120, dogu: 'e_paste' }),
          W('Three targets for today', 'Written, visible, ordered. The day obeys paper better than memory.', { type: 'timed', secs: 120 }),
          W('Caffeine after, not before', 'Water first; coffee 60–90 minutes post-wake. Ride the natural wave down first.')
        ]
      },
      fuin: {
        id: 'fuin', name: 'Wind Down', kanji: '夜', en: 'The night base', mode: 'seal', builtin: true, schedule: 'pm', movements: [
          W('Kitchen closed', 'Last real food two to three hours before bed — digestion and deep sleep compete.'),
          W('Lights low · screens warm', 'Overheads off, lamps on, night mode everywhere.'),
          W('Choose the path', 'Your character path runs here. Short night? Skip it; the base still seals the day.', { type: 'path' }),
          W('Shower — PanOxyl face, chest & back', 'Warm, not hot. Lather the 4% on face, chest, shoulders, back — let it SIT 60–90 seconds while you do hair, then rinse well. White towel only — BP bleaches.', { dogu: 'e_bp' }),
          W('Keto night — Nizoral, 5-minute dwell', 'Lather into the scalp and let it SIT five full minutes — the dwell is the medicine. Then rinse; condition the lengths.', { type: 'timed', secs: 300, days: [2, 5], dogu: 'e_keto' }),
          W('Wash night — gentle + condition', 'Free & Clear on the scalp only, conditioner mids-to-ends. Three washes a week — the curls keep their oil.', { days: [0], dogu: 'e_shmp' }),
          W('Adapalene — one pea, bone-dry', 'Wait 10–15 min post-shower — BONE DRY. One pea, whole face, dodge eyes and nostril creases. FIRST TWO WEEKS: Mon/Wed/Fri only, then nightly. Weeks 2–6 may look worse first — that\u2019s the purge; don\u2019t quit.', { dogu: 'e_ret' }),
          W('Moisturize — CeraVe PM', 'Quarter-size, right over the adapalene.', { dogu: 'e_moist' }),
          W('Minoxidil — half cap, DRY scalp', 'Scalp fully dry. Foam parted into rows, massage in, wash hands. Every night except stamp night.', { days: [1, 2, 3, 4, 5, 6], dogu: 'e_minox' }),
          W('Stamp night — 0.5mm, then nothing', 'Clean scalp, clean stamp, light presses over thinning zones — no dragging. NO minoxidil tonight; it resumes tomorrow.', { days: [0], dogu: 'e_stamp' }),
          W('Floss first', 'C-shape around each tooth, below the gumline, before the brush.', { dogu: 'e_floss' }),
          W('Brush — two full minutes', 'Then spit, don\u2019t rinse. Nothing to eat or drink after.', { type: 'timed', secs: 120 }),
          W('Lay out tomorrow', 'Clothes, gi, bag, water — set where you\u2019ll trip over them.'),
          W('Three lines in the journal', 'What happened, what mattered, what tomorrow needs.', { type: 'timed', secs: 120 }),
          W('The cave', '65–68°F if you can, blackout dark, nothing glowing.'),
          W('4-7-8 wind-down', 'In 4, hold 7, out 8. Long exhales tell the body the day is over.', { type: 'breath', breath: [4, 7, 8, 0, 4] }),
          W('In bed · phone exiled', 'Same time every night. The phone charges in another room. Done means done.')
        ]
      }
    };
  };
})((typeof window !== 'undefined' ? window : global).HOKAGE = (typeof window !== 'undefined' ? window : global).HOKAGE || {});
