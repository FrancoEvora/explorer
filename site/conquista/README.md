# Solaris — Explore e Conquiste · v2

A single-player 2D progression game published at `/jogo/`. The original, three-mission game is retained at `/passeio/`; the labelled masterplan at `/` is preserved.

## Delivered
- Five chapters, 15 sequentially unlocked phases, up to 45 stars.
- Nine gameplay engines: route order, pair memory, hidden-object observation, sequence recall, trail maze, photo composition, precision shots, lane-based equestrian course, and garden composition; the final phase combines three engines.
- Transparent per-level star criteria. Hints cap the activity at two stars; campaign progress never expires.
- Virtual Sóis and XP awarded only for a first completion or a new best star result. Replays at the same or lower score do not generate extra currency or reduce the best result.
- Five chapter prizes and a cosmetic store. Virtual bicycle and horse change the character's map appearance and travel speed. Claimed outfits can be equipped.
- Separate illustrated virtual refuge with six garden positions; owned decorations can be placed, moved and removed. It does not alter the masterplan or reserve a real lot.
- Browser-local save, manual JSON passport export/import, and a PNG achievement card. Web Share is capability-detected; native sharing requires device testing.
- Image error fallback, storage-blocked session mode, pauseable route travel, pointer zoom/pan, small-screen and landscape layouts.

## Boundaries
All currency and prizes are fictional, non-transferable game items with no cash value. No physical benefits, commercial discounts, paid purchases, random prize draws, official ranking, remote accounts or anti-fraud guarantees are enabled. This release does not send player data to a backend. A future real-prize program must define terms and use independently validated server-side results.

Progress from v1 is not converted into v2 star achievements; it remains available in the original game and its original browser storage key. The optional nickname is reused as a suggestion only.

The approximate road network is retained from the reviewed image game. The underlying image and all activities are illustrative, not cadastral data, an architectural plan or evidence of construction completion.

## Verification
`tests/solaris-conquista.cjs` plays every phase in mobile WebKit and desktop Chromium, plus compact/landscape smoke tests. It verifies progress, replay rewards, chapter claims, item purchase, unique garden placement, transport, exports, save restoration, invalid imports, the original viewer and game, image failures and blocked storage.
