# Architecture — a map for making changes yourself

Plain JavaScript, no framework, no build. Every file attaches to one global object, `HOKAGE` (called `G` inside each file). Load order is fixed in `index.html` and matters: data → lore → core → game → climb → fx → reel → ui → ui-climb → ui-run → ui-more.

## The layers

| File | Owns | Touches the DOM? |
|---|---|---|
| `js/data.js` | Villages, clans, ranks, the ten paths, step types, the founder's kit | No |
| `js/lore.js` | Chakra values, the level curve, mission pay, jutsu, sensei, bounties, letters | No |
| `js/core.js` | **State.** Load/save/migrate, the logical day, scrolls, the run engine, sharing | No |
| `js/game.js` | The seal — what a completed day is worth. Bounties, dawn | No |
| `js/climb.js` | The six trials, the Kage campaign, summons, the Bazaar, insights | No |
| `js/fx.js` | Synthesized sound, haptics, ink particles, confetti, count-ups | Effects only |
| `js/reel.js` | The Blood Reading (the clan wheel) | Yes |
| `js/ui.js` | Navigation, the crest, the village scene, home, the dawn gate, boot | Yes |
| `js/ui-climb.js` | The Climb card and sheets, the Bazaar, summons, masks, the card image | Yes |
| `js/ui-run.js` | The run, the gate, the finale, promotions | Yes |
| `js/ui-more.js` | Record, Insights, Scrolls, the Forge, Pouch, the Card, Settings | Yes |

The rule that keeps this sane: **files above `fx.js` never touch the DOM.** They are pure logic, which is why `tests/test.js` can load them in Node and test the whole game without a browser.

## Ideas worth knowing before you edit

**One source of truth.** Every feature that asks "what day is it?" goes through `G.today()`. Change the answer there and streaks, exams, trials, and the calendar all follow. `G.logicalNow()` shifts the clock back by `prefs.dayStart` hours so a 1 AM seal belongs to the night before — but `G.key(date)` never shifts an explicit date, or every window calculation would drift by one day.

**State is one object.** `G.state` is the whole save. `G.save()` writes it and fires a `change` event. `G.load()` sanitizes everything on the way in — that function is where you add a new field's default *and* its validation, so an old save never crashes a new build.

**Views are functions.** `VIEWS.home`, `VIEWS.cal`, etc. Each one renders a full screen with `G.render(html)` and then wires events. `G.go('home')` swaps views. Sheets (`G.sheet(html)`) are the bottom-drawer pattern used everywhere for detail and editing.

**The run engine is a projection.** `G.runMv()` builds the live step list from a scroll: it drops sections, drops steps not scheduled today, and splices path steps into the `⛩` slot. Nothing else should compute that list.

## Common changes

- **New setting** → add the default in `freshState()` and validation in `G.load()`, then a row in `settingsSheet()` in `ui-more.js`.
- **New bounty** → one row in `G.BOUNTIES` (`lore.js`) plus one condition in `G.checkBounties()` (`game.js`).
- **New Bazaar item** → one object in `G.BAZAAR` (`climb.js`); the stall tabs and buy logic pick it up automatically.
- **New step type** → `G.TYPES` in `data.js`, chakra value in `G.stepChakra`, an editor gadget in `editor()` and a renderer in `ui-run.js`.
- **Tuning difficulty** → `G.TRIALS` and `G.KAGE_ARCS` in `climb.js`; the status logic lives in `G.trialStatus()`.

## Testing

`node tests/test.js` swaps in a fake clock and a memory-backed storage, then drives the real engine. Add a test next to the closest existing one; the helpers are `t()`, `eq()`, `ok()`, and `sealBase()`.

## v5 notes

- **Timers** live in `core.js` as pure logic: `G.timerGet/Start/Pause/Reset/Tick/Left`. State is `run.timer = {id,total,status,endAt,left,side2}`. While running, the truth is `endAt − now`; while paused, `left`. The UI (`ui-run.js`) only paints on a 250 ms tick and re-syncs on `visibilitychange`, `focus` and `pageshow`. Completing or skipping a step clears its timer.
- **Guides** (`guides.js`) are a pose engine (`fig()` with a joint list; far limbs drawn lighter) plus an object library, and an ordered regex table — specific before general. `G.guideFor(m)` honours an explicit `m.guide` id first. `G.guideSVG(gd)` returns a 240×180 SVG that inherits `currentColor` and `--gd-acc`.
- **Forge** rows are read-only summaries; editing happens in a `G.sheet(..., {cls:'tall'})` built by `editorHTML()` and wired by `wireEditor()`; the sheet re-renders itself in place and repaints the paper on close. Prompts are `ask()` sheets.
- `css/v5.css` loads after `style.css` and owns the forge, the run controls, the guide board, tall sheets, and `[hidden]`.
