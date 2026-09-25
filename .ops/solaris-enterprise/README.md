# Solaris × Évora Enterprise

The public map reads `solaris-experience` on the existing Enterprise Supabase project. Deploy the files in `functions/solaris-experience` together after applying the migration. The gateway validates a runtime publishable API key itself, matching the Enterprise Bia gateway; Supabase legacy JWT verification is disabled for this function only.

Only the fixed Solaris organization/project/product is read. Public fields are identification, area, commercial status, and current list price for available lots. Active reservations override availability. Sold, blocked, institutional, unrecognized and missing records never expose a price. No inventory, reservation, customer or policy record is changed.

The browser refreshes every minute, on returning to the page, and on selection when the previous reading is older than 15 seconds. Failed requests remove prices and availability rather than retaining stale commercial claims. The source and consultation time are shown in each lot card.

Speech uses the Enterprise's existing enabled AI credentials internally with the same `marin` voice and `gpt-4o-mini-tts` model as Bia. Only server-authored text for a known lot, block or area can be synthesized; arbitrary user text is rejected. Audio is stored in a private bucket under a hash of its actual content. Changed prices produce different audio. Service-only counters bound generation to 12 new clips/client/minute and 800/day globally. Browser speech is an explicitly labelled fallback.

Audio starts after a visitor's gesture. Voice and music have separate switches and levels. Selecting another point cancels the previous voice; music is ducked during narration. Background tabs pause both streams. The guided tour waits for the narration before moving on. The 30-second instrumental is original synthesized music, with no third-party samples.

Validation: `node --test .ops/solaris-enterprise/tests/commercial.test.mjs`; build: `node .ops/build-solaris.mjs`. The build allowlist excludes all backend code, migration and tests from public output. To reproduce the instrumental, run `python .ops/solaris-enterprise/ops/generate-ambient.py solaris-ambient.wav` (NumPy/SciPy), then encode to MP3 with FFmpeg at 64 kbps.
