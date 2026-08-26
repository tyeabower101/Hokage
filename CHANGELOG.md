# Changelog

## v5.0.0 — the rebuild
The last pass before release. The lore stayed; everything the thumb touches was rebuilt.

**Timers that survive your pocket** — a new wall-clock timer engine in `core.js`. Every clock is persisted in the run (`run.timer`), started only when you tap Start, and computed from `endAt` against the real clock — so a locked phone, a switched app, a navigation away, or a full reload lands you back on the same second. Explicit ▶ Start / ❚❚ Pause / 封 Done / ↺ controls replace the tap-double-tap-hold guessing game; the ring itself is a play/pause shortcut. Two-sided steps chime and flip on their own; breath steps show the phase. The screen stays awake while a clock runs (Wake Lock). Four new logic tests cover start, reload, pause/resume, flip and done.

**The sensei's scroll, rebuilt** — 102 guides, one per distinct step (190 built-in step names checked in tests, none fall back to a generic). Each has a proper ink-brush figure drawn by a pose engine (weighted limbs, ground, annotation arrows) or an object illustration, four how-lines, THE ONE MISTAKE that ruins it, and a reference: the ten verified institutional links from v4 where they exist, otherwise an honest, labelled video search — no invented URLs. Illustrations now appear inline on the live run card, on every forge row, in the archive, and in the path reader.

**The Forge, rebuilt** — the paper is dark ink on washi in the app's own surface language; every row is readable (number, illustration, name, duration, chakra, days, extras). Tapping a step opens a full-height editor sheet: name and cue, a four-way type switch, timer presets in a grid, ±1/±5 reps, breath rounds with a live total, seven full-width day toggles, the guide preview, your link and photo, optional/log/tool, duplicate and delete. Every change saves as you type. `window.prompt()` is gone from the app — kanji, sections, custom seconds, renames and log edits all use in-app sheets.

**The path reader** — every character path now reads in full: every step with its cue and illustration; tap any step to open its guide.

**Fixes** — the phantom bar under the forge toolbar (a `hidden` bulk bar that CSS forced visible), "the ten paths" (there are eleven), label overflow on several drawings. Dead forge/run/guide CSS stripped; the v5 surfaces live in `css/v5.css`.

## v4.2.0 — twelve villages, twelve skylines
Every village now has its own drawn skyline — Konoha's carved cliff and torii, Suna's canyon walls and dome dwellings, Kiri's shrine gate standing in misted water, Kumo's peaks wrapped in cloud with a flickering bolt, Iwa's rock fortress, Ame's rain-streaked towers, Taki's living waterfall, Kusa's swaying grass, Oto's sound-wave spires, Yu's steaming bathhouse, Shimo's aurora over ice, Hoshi's crater and observatory. The enrollment picker shows the real scenes, and your hero, dawn gate, and cinematics all render your village's true silhouette — animated (rain falls, steam rises, the bolt strikes), and still under reduced motion. Reference links now sit directly on the live run card next to the gear link, not only behind the ?.

## v4.1.0 — the final hurrah
**Bugs killed** — timers can no longer show NaN under any input (every number is sanitized on load, in the editor, and at format time); navigation is hardened so a failed screen can never silently strand you; tab-swipe now needs a real horizontal fling, so taps on scroll rows can't be mistaken for page swipes; mixed-version cache states degrade gracefully instead of throwing.

**Your own guidance, three ways** — every step now takes (1) a reference link with a label, (2) your own photo (stored in IndexedDB on-device, auto-shrunk, never bloating the save), and (3) written cue text — all editable in the forge, all shown behind the ? on the run card.

**Researched references** — ten curated, verified how-to links from Cleveland Clinic, Healthline, and the American Academy of Dermatology now back the core physical steps (push-up, squat, plank, dead hang, couch stretch, box breathing, belly breathing, sunscreen, legs-up-the-wall, cold showers), alongside the hand-drawn chalkboards.

**The design pass** — one shared surface language across every card (lacquer gradient, hairline, inset light), lacquered primary buttons, washi-textured forge paper, deeper glass sheets, engraved week row, shopfront Bazaar tabs, visible keyboard focus everywhere.


## v4.0.0 — the launch build
**The grade ladder, complete** — custom paths carry a 極 vow toggle (C or B, your honesty). Mastering Guy or Madara (7 seals) and reaching Jōnin permanently unlocks their 解 Released forms, which grade A. At Kage, the eleventh path opens forever: 六道 The Six Paths Vigil — the only S-rank scroll in the game. The picker now shows the whole ladder in tiers, locked paths greyed with their unlock condition. The clone bump can no longer stack past A.

**The guide scrolls** — nineteen hand-drawn chalkboard demonstrations (push-up, squat, plank, dead hang, box breathing, derma stamp, sunscreen, palming, the cold finish…) matched to steps by name, behind a ? on the run card and in the forge. Every step can also carry a reference link + label; links travel inside share codes.

**A new mark** — redesigned app icon: the forehead protector under a red sun.

Plus a full launch polish pass: lit nav indicator with blur, sheet grabbers, tier hairlines, live pulse on today's week dot, hero vignette, unified press states, focus rings, tabular numerals in the finale.


## v3.0.0
**The Dawn Gate** — the first open of each day renders the village, the date, your chain, and one honest line about where you stand.

**The Forge, rebuilt** — sections to group steps, drag-to-reorder, multi-select with bulk move / schedule / delete, undo for every destructive edit, live step-count / minutes / chakra, in-scroll search, a full run preview with running timestamps, duplicate scroll, optional steps, and quick-add grammar (`Push-ups x20`, `Plank 45s`, `Box breathing`, `# Section`).

**Ergonomics** — swipe between the five village screens, long-press a scroll for run / edit / preview, a resume card when a run is left open, bigger targets, haptics on navigation.

**Insights** — a second tab in Record: sealed days by month, which weekdays you actually keep, when you seal, the steps you dodge most, path mastery, and collection totals.

**Your card as an image** — renders to PNG for saving or sharing.

**Sound** — the clan wheel gets its own tick, four distinct tier chords, and a heartbeat under the legendary blackout.

## v2.2.0
Settings overhaul (day start, week start, evening warning, text size, vault, backup reminders). Home hierarchy with a NEXT anchor. At-risk evening state. Academy orientation and one-time hints. Jiraiya's and Hyūga's perks made real. Dead exam engine removed. Sensei lines doubled, bounties 22 → 30, failure letters.

## v2.1.0
The Blood Reading wheel. The Climb: six trials and the four-arc Kage campaign. The Village Bazaar, seven summons, ANBU masks, hero moods, demotion.

## v2.0.0
Chakra, levels, ryō, mission ranks, jutsu, sensei, the Bingo Book, the Market, the run rebuild.
