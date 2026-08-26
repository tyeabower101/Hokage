# 火 HOKAGE

**The way is showing up.** A Naruto-themed routine tracker built as an offline-first PWA. Seal your days, earn chakra, climb ranks through trials almost nobody finishes.

No accounts. No servers. No ads. Everything lives in `localStorage` on your device.

## Run it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static server works. There is no build step — the app is plain ES5-style JavaScript, two CSS files (`style.css`, and `v5.css` for the rebuilt forge/run/guide surfaces), and a service worker.

## Deploy

Push the contents of this repo to a GitHub Pages branch (or any static host). The app is served from `index.html`.

**Every deploy:** bump `VERSION` in `sw.js` (e.g. `hokage-v3.0.1`). The service worker is cache-first — without a version bump, installed phones keep serving the old files forever.

## Tests

```bash
node tests/test.js
```

46 logic tests covering state, migration, the run engine, the wall-clock timers, the seal, the Climb's six trials, the Bazaar, summons, the logical day, the forge, the guide library, and the level curve. They run headless with no dependencies.

## What's in it

- **Two base scrolls** — Wake Up and Wind Down — plus ten character paths and any scroll you forge yourself.
- **Chakra & levels** — every completed step pays; levels awaken six jutsu with real mechanics (Kawarimi shields a missed day, Kage Bunshin rewards doubles, Rasengan fires on every 7-chain, Sage Mode at thirty days).
- **Ryō & the Village Bazaar** — six stalls of cosmetics, seven living summons signed in blood, and a Lineage Vault that money cannot open.
- **The Climb** — six opt-in trials: the Bell Test, the Forest of Death, the Specialization, the Trial of the Three, ANBU Selection (a week with every number hidden), and a four-arc Kage campaign.
- **The Blood Reading** — a physical clan wheel you flick, with near-miss tension and four tiers of reveal.
- **The Forge** — sections, drag-to-reorder, bulk select and move, undo, live time and chakra estimates, search, preview, duplicate — and a 極 vow toggle that grades your own path B.
- **The guide scrolls** — hand-drawn demonstrations behind a ? on the steps that need showing, plus a reference link on any step you forge.
- **The full grade ladder** — D base → C path → B 極 → A Released (master a vow + reach Jōnin) → S, by the Six Paths Vigil at Kage or a perfect week.
- **The Dawn Gate** — the first open of each day is a moment, not a menu.

## Data

Everything is one `localStorage` key: `HOKAGE_V1`. Export a backup from Settings → The Vault. v1 and v2 saves migrate forward automatically; v1 `HOKAGE1:` share codes still import.

## Docs

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — which file owns what, and how to change things safely.
- [`CHANGELOG.md`](CHANGELOG.md) — what shipped when.

## License

MIT — see [`LICENSE`](LICENSE). Naruto is the property of Masashi Kishimoto and Shueisha; this is a personal, non-commercial fan project with no official affiliation.
