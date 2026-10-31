# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Personal blog (zavarov.com) built with Hugo using the [hugo-mini](https://github.com/zavarovkv/hugo-mini) theme (git submodule). Multilingual: Russian (default) + English (auto-translated via OpenAI API). Content is focused on Product Management topics. Blog layouts, CSS/JS, fonts, KaTeX, and Likely live in the theme. Event landing pages are a separate site-owned module under `events/`, with their own templates, styles, scripts, fonts, metadata and page bundles.

## Build & Development Commands

```bash
hugo server                              # Local dev server with live reload
hugo --minify                            # Production build (outputs to /public)
npm run translate                        # Translate new/changed content to EN
npm run translate -- --force             # Re-translate all content
npm run translate -- blog/brandage.md    # Translate specific file
npm run fetch-telegram-reactions         # Pull reaction/view counts from Telegram channel into data/telegram_reactions.json
```

The site requires Hugo Extended 0.154.5 or newer; the independent theme retains its 0.146.0 minimum. Translation requires `OPENAI_API_KEY` env variable. The Telegram reactions fetch script lives inside the theme (`themes/hugo-mini/scripts/fetch-telegram-reactions.mjs`) and is invoked via the npm alias above — it auto-resolves channel and content dir from Hugo config, including `module.mounts.sites.matrix`. `npm test` covers site, event, and theme tests; `npm run check:syntax` checks all authored JavaScript.

## Deployment

Automated via GitHub Actions (`.github/workflows/gh-pages.yml`). Push to `main` triggers: `npm ci` → `npm run translate` (OpenAI API) → `npm run fetch-telegram-reactions` → `npm run build` (refresh GitHub stars, then build Hugo) → content/link/asset checks → commit EN translations and the GitHub star snapshot → deploy to GitHub Pages. API key is stored in GitHub Secrets (`OPENAI_API_KEY`). Telegram reactions step uses `continue-on-error: true` so a Telegram outage never blocks the deploy — the fetch script also does its own per-post retry with exponential backoff and 429 Retry-After handling, and the Hugo partials handle missing data gracefully. The "Translate content" and "Commit generated updates" steps are gated on `github.event_name == 'push' && github.ref == 'refs/heads/main' && github.event.head_commit.author.email != 'github-actions[bot]@users.noreply.github.com'` — the author-email check (rather than `github.actor`) is what reliably breaks the auto-translate bot loop, and the branch check keeps CI from touching anything on PRs.

Homepage project stars use the theme's `github-stars` shortcode and `scripts/fetch-github-stars.mjs` helper. Counts live in site-owned `data/github_stars.json`. `npm run dev` and `npm run build` refresh them before Hugo; CI supplies its existing `GITHUB_TOKEN`. API failures preserve the saved count, and browsers make no counter requests. Plain Hugo commands use saved data only.

## Architecture

- **Blog theme**: [hugo-mini](https://github.com/zavarovkv/hugo-mini) (git submodule at `themes/hugo-mini/`) — provides the blog's base layouts, CSS, JS, fonts, KaTeX, Likely, shortcodes, i18n UI strings, and build scripts (`fetch-telegram-reactions.mjs`). The blog does not shadow theme assets; its fonts/katex/likely are served from the theme directly.
- **Blog override**: `layouts/_partials/custom_head.html` adds Yandex/Google verification meta tags. The theme uses Hugo's current template system (0.146+), so partials live under `_partials/` with the underscore.
- **Independent event module**: all event-specific code and content live under `events/`; see `events/README.md` and the `events/new.mjs` generator when creating another webinar.
  - Hugo mounts `events/layouts` into `layouts`, `events/assets` into the separate `assets/events` namespace, and `events/content/ru` into Russian content. Content mounts select languages through `sites.matrix.languages`; do not restore the removed `mounts.lang` option or duplicate them with language `contentDir` settings. Keep explicit mounts for the blog's normal `layouts`, `assets`, `content/ru` and `content/en`: adding a component mount replaces its default project mount.
  - `events/layouts/event/landing.html` is a complete HTML document, selected by `type = "event"` and `layout = "landing"`. It does not extend the theme's base template or load theme CSS, JS, fonts, partials, OG hooks or JSON-LD. Event fonts and shared assets belong to `events/assets`; never couple an event to `themes/hugo-mini/`.
  - Each webinar is a branch bundle at `events/content/ru/<slug>/_index.md`, with its own portraits and cover in the same directory. The existing webinar remains at `/pm-hiring-webinar/`. Read bundle images with the page's `.Resources`, not global `resources.Get`.
  - The event module owns its share card, canonical/Open Graph/Twitter tags and Event JSON-LD. `event_start` / `event_end` are the only stored schedule values; derive the localized landing, confirmation, title and share-card labels from them. Keep explicit Moscow offsets.
  - The registration field posts to Google Forms through a hidden iframe. Keep `registration_telegram_field` aligned with Google's `entry.*` question name. An iframe response cannot prove acceptance or storage by Google Forms.
  - Event `_index.md` files are maintained by hand and remain outside the blog translator's scope. Source validation in `scripts/check-site.mjs` scans both `content/` and `events/content/`; its output checks validate the whole generated site.
- **Header title split**: the theme's `header.html` auto-splits `.Site.Title` on the first space into `.title-first-name` / `.title-last-name` spans (so `"Константин Заваров"` renders as two styleable pieces). No site override needed.
- **i18n**: site's `i18n/*.toml` contain only category display name overrides; all UI strings come from theme

## Multilingual (i18n)

- Hugo multilingual mode with directory-based content separation
- Russian (default): `content/ru/` — URLs at `/:slug/`, `/blog/`
- English: `content/en/` — URLs at `/en/:slug/`, `/en/blog/`
- `defaultContentLanguageInSubdirectory = false` — no `/ru/` prefix, existing URLs preserved
- UI strings: `i18n/ru.toml`, `i18n/en.toml` — templates use `{{ i18n "key" }}`
- Per-language menus configured in `config.toml` under `[languages.ru.menu]` / `[languages.en.menu]`
- Language switcher in footer uses Hugo's `.Translations` (server-side links, no JS)
- hreflang tags in `<head>` for SEO
- Translation script: `scripts/translate.mjs` — Node.js, uses the official `openai` SDK and Responses API (`gpt-5.6-luna` by default, configurable via `OPENAI_MODEL`)
- EN content is auto-generated and committed by CI; do NOT manually edit files in `content/en/` — the script writes a `source_hash` (SHA-256 of normalized RU content) into the EN file's front matter and re-translates whenever that hash changes, so any manual EN edit will be overwritten on the next RU change. Use `--force` to re-translate regardless of hash. Exception: `_index.md` files are skipped by the script, so `content/en/_index.md` is maintained by hand.

The translator uses one retry loop (at most three requests per file), a two-minute request timeout and a batch budget of at least five minutes, scaled to two minutes per pending file for larger batches. It stops on the first terminal failure without publishing validated earlier files or pruning EN content; CI keeps using `--allow-stale`.

## Content

- Blog posts: `content/ru/blog/*.md` with TOML front matter (`+++`)
- Pages: `content/ru/consultation.md`, `content/ru/_index.md`
- Event bundles: `events/content/ru/<slug>/_index.md` plus local portraits and cover, rendered independently of the blog theme
- Reading shelf: `content/ru/blog/books.md` uses site-owned `data/books.toml` and the theme's `reading-list` shortcode. Book reviews are regular `content/ru/blog/book-*.md` posts with `hidden = true`, so they remain indexable and in the sitemap without crowding article listings. Keep the existing `collections` category key, language-relative legacy `url` values and shared book metadata; see `docs/books.md`. The shelf's New badge depends only on a book's `added` date, never its article date. Use a compact two-column table: book details on the left, reading month aligned on the right, with the blog's shared typography.
- Book display strings live under each record's `translations.en`; `source_url` retains bibliographic verification without adding UI links. IDs, dates, years, ratings and review references remain shared. The English shelf and 26 reviews were prepared locally at the user's explicit request, with validated `source_hash` metadata. They build without an API; keep their translations synchronized when revising the Russian sources.
- EN equivalents: `content/en/blog/*.md` (auto-generated), `content/en/_index.md` (manual — the translate script skips `_index.md`)
- Front matter fields: `title`, `slug`, `date`, `description`, `categories`, optional `draft`, `telegram_post`, `math`, `mermaid`, `hidden`, `pinned`. EN files additionally carry `source_hash` written by the translator (see Multilingual section).
- `hidden = true` excludes a post from listings, recent-posts sidebar, JSON feed, and `llms.txt` (but the page still renders at its permalink and is crawlable). Use for unlisted/evergreen pages linked only from specific posts.
- Local Markdown images get intrinsic dimensions from the theme. Existing raw HTML images should carry explicit `width` and `height`; `main img[width][height]` keeps their height responsive.
- Posts are grouped by `categories` on the blog listing page; existing categories: Маркетинг, Стратегия и фреймворки, Метрики и аналитика, Команда и лидерство, Саморазвитие, Продуктивность, Подборки
- Both manually maintained homepages place `latest-posts` and Projects inside the theme's `columns` shortcode; `column` groups the project heading and description. They sit side by side on desktop and stack on mobile. Each homepage requests the five latest visible posts by date in the current language; `archive` / `archiveLabel` add the link to all articles. Projects link to Hugo Mini's catalog entry and Beauty.css on npm; both GitHub star counts are fetched by the build script.
- Projects use the theme's `project` shortcode: a linked name with a ↗ arrow, followed by a Markdown description. Project titles and the archive link use the standard medium content-link weight and inline label rules aligned with ordinary links. Arrows inherit the link color but retain the body text's light weight. Description links and article-list links retain their light weight; repository labels also use inline underlines and their star counts share the text baseline.
- `pinned = true` in a post's front matter floats it to the top of its category group on the blog listing (chronological order is preserved among multiple pinned posts and among the rest)
- Markdown headings (`## `, `### `) get a clickable `#` anchor link via theme render hook — convert any inline `<h2>...</h2>` HTML in old posts to native markdown `##` so the hook can attach. Mobile: icon is hidden by default (`display: none`), tap heading to reveal it, tap icon to copy URL + scroll natively. `h2`/`h3` have `scroll-margin-top: 0.75rem` for breathing room after anchor navigation.
- `params.recentSidebarCount` in `config.toml` (or in `themes/hugo-mini/hugo.toml` default: 8) — controls how many recent posts appear in the sidebar/bottom block on single posts. The block is rendered by `partial "recent-posts.html"` which uses Hugo `return` to pass a slice; the caller in `single.html` places it inside `<aside class="recent-sidebar" id="recent-sidebar">`. On desktop with a wide-enough right gutter (≥ 180px) JS positions the aside absolutely in the gutter (`position: absolute`, scrolls with page). On mobile it renders as a static block at the bottom of the article using the same `ul.blog-posts` listing style.
- URL pattern: `/:slug/` for RU, `/en/:slug/` for EN (configured in `config.toml` permalinks)
- Text rule: never use the letter «ё» — always write «е» (its «её» → «ее», «еще» instead of «ещё»)

## Static Assets

Blog fonts and KaTeX live in the theme's `static/`; Likely sources live in `assets/likely/` and Hugo minifies and fingerprints them only on pages with social sharing enabled. All these assets are self-hosted — the site used to shadow them with bit-identical copies, which is now removed. Theme CSS combines a pinned Beauty.css foundation with theme-owned `assets/css/main.css`; Hugo Pipes emits one minified, fingerprinted stylesheet. The generated foundation, upstream commit, checksum and license belong to the theme and are refreshed only by its `scripts/vendor-beauty.mjs` helper. The site does not load an npm package or CDN at runtime. The browser caches one `/css/main.min.<sha>.css` and one `/js/main.min.<sha>.js`; localized JS strings are passed through `body[data-i18n]`, so the bundle is shared across languages.

Shared native typography and editorial helpers belong to Beauty.css. The theme configures their `--beauty-*` variables and owns layout, UI components and font loading. Keep article markup free of inline font styling; use the library's editorial helpers or semantic Markdown. Do not copy base text rules into the theme or site. Local development snapshots use the theme helper's `--local` mode and must be replaced with a reviewed upstream pin before a theme release.

Theme-owned for the blog (do not shadow these paths in the site):
- Inter font family (WOFF2 for normal 300/500/600 and italic 300, matching the active `@font-face` declarations; unused font files are not shipped). 300 and 600 are preloaded in `baseof.html`.
- KaTeX math rendering (loaded conditionally on `math = true` in front matter).
- Ilya Birman's Likely social sharing buttons (`assets/likely/`, minified and fingerprinted by Hugo, loaded only on blog post pages with sharing enabled).

Site-owned (`static/` in the blog repo):
- `CNAME` — GitHub Pages custom-domain file (`zavarov.com`).
- `data/` — post-specific datasets referenced from markdown (e.g. `retention-dataset.csv`).
- `images/` — avatars (`avatar1.webp`, `avatar2.webp`), post illustrations, favicons (`favicon.png` 32×32, `favicon-192.png` 192×192, `apple-touch-icon.png` 180×180), `og-default.png` base for dynamic OG image generation.

Third-party runtime behavior:
- Mermaid is **self-hosted from a pinned npm dependency** (`11.16.1`), not a CDN or committed blob. `scripts/vendor-mermaid.mjs` copies `mermaid.esm.min.mjs` and its `.mjs` chunks into `static/js/mermaid/` during `postinstall`. `params.mermaidModuleSrc` selects that ESM entry. The theme retains `mermaidSrc` and its pinned CDN fallback for other consumers.
- The browser loads Mermaid near the first diagram and fetches only the required diagram modules. Each diagram renders near the viewport; theme changes are serialized, and loading failures reveal the original source. Test animated edges and modern shapes when bumping the pinned version.
- Generated modules are gitignored. `npm ci`, `npm install`, or `npm run vendor-mermaid` regenerates them; the workflow checks the entry and the normal site check validates emitted local assets. A fresh clone must install npm dependencies to render diagrams.
- npm verifies dependencies against `package-lock.json`. Likely counters remain disabled; optional Yandex Metrika and Telegram comments still contact their services.
- Note: `npm` here is configured against a corporate Artifactory registry (`npm config get registry`), which may be unreachable outside the corporate network. `package-lock.json` resolves everything from `registry.npmjs.org`, and CI uses the public registry; locally, add `--registry https://registry.npmjs.org` if an install hangs.

## Theme vs Site Overrides

`themes/hugo-mini/` is the project's own submodule — edit it directly. If a fix or change belongs to the theme (CSS, JS, layouts, partials, static assets inside the theme), apply it in the theme. Do not work around it with patches in `layouts/_partials/custom_head.html` or by re-adding shadowed copies of theme assets. Blog overrides exist strictly for site-specific search-engine verification. Event landing pages are a separate site-owned module in `events/`; keep their templates, CSS, JS, fonts and assets there rather than in the theme or root-level blog overrides.

## Config Parameters

Site-level `[params]` in `config.toml` consumed by theme templates (see `themes/hugo-mini/layouts/` for usage):

- **Identity**: `authorURL`, `favicon`, `avatar` / `avatarHover` (two-frame hover on header), `[params.author].jobTitle`, `[params.social]` (telegram, linkedin, github, email — rendered in footer and JSON-LD).
- **i18n UI**: `aiTranslatedLang` (language code whose footer gets the AI-translated sparkle icon; here `"en"`), per-language `authorName` / `description` / `title` under `[languages.<lang>.params]`.
- **Copyright/freshness**: `copyrightYear` (start year for the `YYYY–currentYear` range in footer), `newPostDays` (window in days for the "new" badge on listings).
- **Listing layout**: `recentSidebarCount` (see Content section), `socialSharing` (default true; set false to hide Likely bar on posts), `pinned` (front-matter, not params).
- **Analytics** (all optional; theme emits each block only if its ID is set): `yandexMetrikaId`, `googleAnalyticsId`, `plausibleDomain` / `plausibleSrc`, `umamiWebsiteId` / `umamiSrc`.
- **Telegram**: `telegramChannel` (channel slug used for post comments widget and reactions fetch).
- **llms.txt**: per-language `llms.about` under `[languages.<lang>.params]` — free-text author bio rendered in the theme's `home.llms.txt` output; contacts/sections/articles are derived from `params.social`, `menu.main`, and the blog section automatically.
- **Easter eggs**: `consoleArt` (multi-line string printed via `console.log` on page load; theme has `consoleYoda` as a default variant).

## Key Conventions

- Config file: `config.toml` (TOML format)
- Content front matter: TOML (`+++` delimiters)
- Markdown renderer: Goldmark with `unsafe: true` and math extensions enabled
- Primary content language: Russian; English auto-translated via OpenAI API
- Base URL: `https://zavarov.com/` (custom domain via GitHub Pages CNAME)
- Content license: CC BY-SA 4.0

## Working Preferences

- For this user's own repositories, push small agreed changes directly to `main`; do not create a branch or PR for every commit unless explicitly requested.
- Keep commits focused and sequential. When a theme change is made, push `themes/hugo-mini` first, then commit and push the updated submodule pointer in this repository.
- Do not modify or regenerate translations unless the user explicitly asks; in particular, do not manually edit `content/en/`.

## Hugo Themes Catalog

- Hugo Mini's catalog submission, [gohugoio/hugoThemesSiteBuilder#698](https://github.com/gohugoio/hugoThemesSiteBuilder/pull/698), was merged on 2026-09-02. The theme is listed at https://themes.gohugo.io/themes/hugo-mini/.
- The supporting Roxo repository-path fix, [gohugoio/hugoThemesSiteBuilder#766](https://github.com/gohugoio/hugoThemesSiteBuilder/pull/766), was merged on 2026-08-17. Both catalog tasks are complete; there is no pending branch update or Netlify retry from that submission.
- The theme's Go module path is `github.com/zavarovkv/hugo-mini/v3`. Check the repository's current releases and this site's submodule pointer when reviewing versions; do not reuse the historical submission's release or commit snapshots.
