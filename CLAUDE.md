# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog (zavarov.com) built with Hugo using the [hugo-mini](https://github.com/zavarovkv/hugo-mini) theme (git submodule). Multilingual: Russian (default) + English (auto-translated via Claude API). Content is focused on Product Management topics. The site is intentionally thin: everything that can live in the theme does (layouts, CSS/JS, fonts, KaTeX, Likely). The only site-level layout override is `layouts/_partials/custom_head.html` for search-engine verification meta tags.

## Build & Development Commands

```bash
hugo server                              # Local dev server with live reload
hugo --minify                            # Production build (outputs to /public)
npm run translate                        # Translate new/changed content to EN
npm run translate -- --force             # Re-translate all content
npm run translate -- blog/brandage.md    # Translate specific file
npm run fetch-telegram-reactions         # Pull reaction/view counts from Telegram channel into data/telegram_reactions.json
```

Hugo extended version is required. Translation requires `ANTHROPIC_API_KEY` env variable. The Telegram reactions fetch script lives inside the theme (`themes/hugo-mini/scripts/fetch-telegram-reactions.mjs`) and is invoked via the npm alias above — it auto-resolves channel and content dir from Hugo config.

## Deployment

Automated via GitHub Actions (`.github/workflows/gh-pages.yml`). Push to `main` triggers: `npm ci` → `npm run translate` (Claude API) → commit EN translations → `npm run fetch-telegram-reactions` → `hugo --minify` → deploy to GitHub Pages. API key is stored in GitHub Secrets (`ANTHROPIC_API_KEY`). Telegram reactions step uses `continue-on-error: true` so a Telegram outage never blocks the deploy — the fetch script also does its own per-post retry with exponential backoff and 429 Retry-After handling, and the Hugo partials handle missing data gracefully. The "Translate content" and "Commit translations" steps are gated on `github.event_name == 'push' && github.ref == 'refs/heads/main' && github.event.head_commit.author.email != 'github-actions[bot]@users.noreply.github.com'` — the author-email check (rather than `github.actor`) is what reliably breaks the auto-translate bot loop, and the branch check keeps CI from touching anything on PRs.

## Architecture

- **Theme**: [hugo-mini](https://github.com/zavarovkv/hugo-mini) (git submodule at `themes/hugo-mini/`) — provides all base layouts, CSS, JS, fonts, KaTeX, Likely, shortcodes, i18n UI strings, and build scripts (`fetch-telegram-reactions.mjs`). The site does NOT shadow theme assets; fonts/katex/likely are served from the theme directly.
- **Site overrides** (one file in `layouts/_partials/`):
  - `custom_head.html` — Yandex/Google verification meta tags. The theme's layouts follow Hugo's current template system (0.146+), so partials live under `_partials/` with the underscore; the theme's former `extra_head.html` hook was removed as a duplicate of `custom_head.html`.
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
- Translation script: `scripts/translate.mjs` — Node.js, uses `@anthropic-ai/sdk` (claude-sonnet-4-6)
- EN content is auto-generated and committed by CI; do NOT manually edit files in `content/en/` — the script writes a `source_hash` (SHA-256 of normalized RU content) into the EN file's front matter and re-translates whenever that hash changes, so any manual EN edit will be overwritten on the next RU change. Use `--force` to re-translate regardless of hash. Exception: `_index.md` files are skipped by the script, so `content/en/_index.md` is maintained by hand.

## Content

- Blog posts: `content/ru/blog/*.md` with TOML front matter (`+++`)
- Pages: `content/ru/consultation.md`, `content/ru/_index.md`
- EN equivalents: `content/en/blog/*.md` (auto-generated), `content/en/_index.md` (manual — the translate script skips `_index.md`)
- Front matter fields: `title`, `slug`, `date`, `description`, `categories`, optional `draft`, `telegram_post`, `math`, `mermaid`, `hidden`, `pinned`. EN files additionally carry `source_hash` written by the translator (see Multilingual section).
- `hidden = true` excludes a post from listings, recent-posts sidebar, JSON feed, and `llms.txt` (but the page still renders at its permalink and is crawlable). Use for unlisted/evergreen pages linked only from specific posts.
- Posts are grouped by `categories` on the blog listing page; existing categories: Маркетинг, Стратегия и фреймворки, Метрики и аналитика, Команда и лидерство, Саморазвитие, Продуктивность, Подборки
- `pinned = true` in a post's front matter floats it to the top of its category group on the blog listing (chronological order is preserved among multiple pinned posts and among the rest)
- Markdown headings (`## `, `### `) get a clickable `#` anchor link via theme render hook — convert any inline `<h2>...</h2>` HTML in old posts to native markdown `##` so the hook can attach. Mobile: icon is hidden by default (`display: none`), tap heading to reveal it, tap icon to copy URL + scroll natively. `h2`/`h3` have `scroll-margin-top: 0.75rem` for breathing room after anchor navigation.
- `params.recentSidebarCount` in `config.toml` (or in `themes/hugo-mini/hugo.toml` default: 8) — controls how many recent posts appear in the sidebar/bottom block on single posts. The block is rendered by `partial "recent-posts.html"` which uses Hugo `return` to pass a slice; the caller in `single.html` places it inside `<aside class="recent-sidebar" id="recent-sidebar">`. On desktop with a wide-enough right gutter (≥ 180px) JS positions the aside absolutely in the gutter (`position: absolute`, scrolls with page). On mobile it renders as a static block at the bottom of the article using the same `ul.blog-posts` listing style.
- URL pattern: `/:slug/` for RU, `/en/:slug/` for EN (configured in `config.toml` permalinks)
- Text rule: never use the letter «ё» — always write «е» (its «её» → «ее», «еще» instead of «ещё»)

## Static Assets

Fonts, KaTeX, and Likely live in the theme (`themes/hugo-mini/static/`) and are served directly from there — the site used to shadow them with bit-identical copies, which is now removed. Theme CSS and JS are bundled, minified and fingerprinted via Hugo Pipes (`themes/hugo-mini/assets/css/main.css`, `themes/hugo-mini/assets/js/main.js`). The browser caches one `/css/main.min.<sha>.css` and one `/js/main.<lang>.min.<sha>.js` per language.

Theme-owned (do not duplicate in site):
- Inter font family (WOFF2 for 200/300/300italic/400/500/600/700; `@font-face` declares only the weights actually used: 300, 500, 600). 300 and 600 are preloaded in `baseof.html`.
- KaTeX math rendering (loaded conditionally on `math = true` in front matter).
- Ilya Birman's Likely social sharing buttons (loaded only on blog post pages).

Site-owned (`static/` in the blog repo):
- `CNAME` — GitHub Pages custom-domain file (`zavarov.com`).
- `data/` — post-specific datasets referenced from markdown (e.g. `retention-dataset.csv`).
- `images/` — avatars (`avatar1.webp`, `avatar2.webp`), post illustrations, favicons (`favicon.png` 32×32, `favicon-192.png` 192×192, `apple-touch-icon.png` 180×180), `og-default.png` base for dynamic OG image generation.

Third-party (none in the page):
- Mermaid is **self-hosted from a pinned npm dependency**, not a CDN and not a committed blob. `mermaid` sits in `devDependencies` at an exact version (`11.14.0`, no caret), and the `postinstall` hook runs `scripts/vendor-mermaid.mjs`, which copies `node_modules/mermaid/dist/mermaid.min.js` to `static/js/mermaid.min.js`. `config.toml` sets `params.mermaidSrc = "js/mermaid.min.js"`, so the theme emits a local `<script>` instead of its default jsDelivr URL. No page makes a third-party request; the only external hit left is the Yandex.Metrika counter, which is opt-in analytics.
- The vendored file is gitignored (~3 MB — it would land in history on every bump). `npm ci` in CI and `npm install` locally both regenerate it; `npm run vendor-mermaid` does it on demand. A fresh clone that runs `hugo server` **without** installing npm deps first will serve pages fine but diagrams won't draw. The deploy workflow asserts `public/js/mermaid.min.js` is non-empty after the Hugo build, so a skipped hook fails CI instead of shipping a broken diagram page.
- npm verifies the download against the integrity hash in `package-lock.json`; the bundle is byte-identical to what jsDelivr serves for that version (`sha384-1CMXl090wj8Dd6YfnzSQUOgWbE6suWCaenYG7pox5AX7apTpY3PmJMeS2oPql4Gk`, the same hash the theme uses for its SRI attribute).
- To bump: `npm install -D mermaid@<ver> --save-exact`, then render a page using modern syntax (animated edges `e1@-->`, `S@{ shape: ... }`, `animate: true`) — older 11.x versions silently fail on these, and a newer release can equally break existing diagrams, which is why the version is pinned rather than floating. If the script fails to load, the theme shows the raw diagram source instead of a blank hole.
- Note: `npm` here is configured against a corporate Artifactory registry (`npm config get registry`), which may be unreachable outside the corporate network. `package-lock.json` resolves everything from `registry.npmjs.org`, and CI uses the public registry; locally, add `--registry https://registry.npmjs.org` if an install hangs.

## Theme vs Site Overrides

`themes/hugo-mini/` is the project's own submodule — edit it directly. If a fix or change belongs to the theme (CSS, JS, layouts, partials, static assets inside the theme), apply it in the theme. Do not work around it with patches in `layouts/_partials/custom_head.html` or by re-adding shadowed copies of theme assets. Site overrides exist strictly for site-specific concerns; currently the only one is `custom_head.html` for search-engine verification meta tags.

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
- Primary content language: Russian; English auto-translated via Claude API
- Base URL: `https://zavarov.com/` (custom domain via GitHub Pages CNAME)
- Content license: CC BY-SA 4.0
