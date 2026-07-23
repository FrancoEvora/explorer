# Explorer 4.2.2-rc.1 — Validation Report

## Objective
Reliability and observability candidate. Production remains on 4.2.1/4.2.

## Changes
- Fixes undefined `trail` reference in trail detail author/message actions.
- Adds client-side error telemetry with redaction, deduplication and a 20-event/session cap.
- Uses an existing icon as avatar fallback.
- Adds explicit candidate version marker.

## Gates executed
- JavaScript syntax: **PASS** for all candidate scripts.
- HTML IDs: **PASS**; 204 unique IDs, no duplicates.
- Local assets referenced by HTML: **PASS**.
- Migration dry-run: **PASS** inside a transaction; rolled back.
- RLS audit: **PASS**; all public tables have RLS enabled.
- Telemetry privacy review: **PASS**; no coordinates, form values, photos, messages, emergency contacts, e-mails or tokens are collected.
- Candidate payload: **PASS**; HTTP 200, title marker present, telemetry present, old undefined-reference bug absent and corrected reference present.
- Preview rendering: **FAIL**; the Supabase gateway reports `Content-Type: text/plain`, so the candidate cannot be accepted as a browser-renderable preview under the current gate.
- Production safety: **PASS**; no production deployment or destructive migration.

## Known limitations
- Full iPhone/Safari device test remains required before promotion.
- External CDN availability for Supabase JS and Leaflet remains a runtime dependency.
- A Vercel preview proxy or equivalent HTML-serving layer is required before this candidate can be approved.

## Decision
**BLOCKED AT PREVIEW GATE. RETAINED. NOT PUBLISHED.**

The production deployment remains unchanged. The candidate must be revalidated through a preview endpoint returning `text/html; charset=utf-8` before it can count as Candidate 1 approved.
