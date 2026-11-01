# Agent Council landing

The public RU/EN landing is owned by this Hugo repository:
- `/council/` — Russian
- `/en/council/` — English

The authenticated app remains on `https://council.zavarov.com`. The landing links to `/login?next=%2Fprofiles` on that origin; Telegram/OAuth callbacks, sessions and secrets must never move into the static site.

## Source files

- `content/{ru,en}/council.md`: page metadata
- `layouts/council/single.html`: bilingual standalone page
- `assets/council/council.css`: scoped styling
- `scripts/fetch-council-avatars.py`: copies approved 256×256 PNG portraits from a pinned public Agent Council commit to `static/council/avatars/` before Hugo builds

Portraits are fetched at build time, not by browsers from the application origin. The pinned source revision must be reviewed when portraits change. To preview locally, run `python3 scripts/fetch-council-avatars.py` before `hugo server`. The build fails if an image is unavailable or malformed rather than silently deploying broken cards.

The old application's live model/task/token counters are intentionally not displayed. Do not add unauthenticated cross-origin access to private telemetry. A future public snapshot would require a sanitized schema, explicit authorization and caching.

## Deployment order

1. Blog PR CI green, visual RU/EN/mobile review, all four images present.
2. Merge and deploy blog PR; verify both URLs and sign-in link.
3. Only then deploy Agent Council Nginx redirect PR. Keep 302 until verified.
4. Smoke-test `/login`, Telegram login callback, `/auth/*`, `/api/*`, `/integrations/linear/*` and the dashboard. Roll back the app redirect if any protected route breaks.
