# Agent Council landing

This Hugo repository owns the public RU/EN Council pages at `/council/` and
`/en/council/`. The same build produces a standalone artifact for
`https://council.zavarov.com/` and `/en/`. There is no redirect from the Council
subdomain to the blog. Login, Telegram OAuth, sessions and all private API routes
remain in the Agent Council application.

## Editing and preview

- `content/{ru,en}/council.md`: page metadata; normal translation rules apply.
- `layouts/council/single.html`: team markup using the real theme base template.
- `layouts/partials/council/footer.html`: project links, RU/EN, theme control, © 2026.
- `assets/council/council.css`: Council layout; typography/colors come from the theme.
- `assets/council/team.js`: public aggregate statistics, updated every five minutes.
- `scripts/fetch-council-avatars.py`: reviewed, pinned 256×256 PNG portraits.

Run `npm ci`, `python3 scripts/fetch-council-avatars.py`, then `hugo server`.
Use `hugo --minify --panicOnWarning` and `python3 scripts/package-council-landing.py`
for the standalone archive. Generated portraits and the archive are ignored by Git.
No translation regeneration or access credentials are needed for a local build.

## Public data and packaging

On the Council origin, cards read `/auth/login/council/team`, the existing public
allowlist of agent names, models, completed-task counts and token totals. The
endpoint contains no messages, task text or credentials. Requests omit cookies;
failures show unavailable values rather than inventing counters. On the blog origin,
that endpoint is absent, so the informational cards remain visible without metrics.
Do not introduce cross-origin access to private application endpoints.

The packager collects page assets and transitive CSS font/image references under
`/council/`. It rewrites local paths and recomputes stylesheet integrity after URL
changes. Both deployed pages keep their localized canonical, hreflang and social
metadata; the deployed structured data describes a WebPage, not a dated blog post.
All four portraits, theme controls, the Qui-Gon Telegram link and login remain present.

## Deployment

1. Run tests and build checks; inspect RU/EN at mobile/desktop widths and both themes.
2. Merge the reviewed build, then select its exact successful main workflow artifact
   `council-landing-<sha>-deploy`. Record the run, commit and archive SHA-256.
3. Follow Agent Council's `docs/council-static-deploy.md` to stage the artifact and
   perform the guarded Nginx cutover. All assets use `/council/*`; app/auth routes stay
   proxied. Do not switch the root before a complete artifact is installed.
4. Verify exact candidate bytes over direct-origin TLS, all resources, statistics,
   login and unauthorized API rejection. Retain the previous static release and
   Council Nginx configuration for rollback.

The optional manual deployment workflow is inactive until a separately authorized
restricted SSH identity, protected GitHub environment and origin rollback check are
configured. This repository never stores application or OAuth secrets.
