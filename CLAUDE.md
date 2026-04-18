# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog (zavarov.com) built with Hugo using the [hugo-mini](https://github.com/zavarovkv/hugo-mini) theme (git submodule). Multilingual: Russian (default) + English (auto-translated via Claude API). Content is focused on Product Management topics. The site is intentionally thin: everything that can live in the theme does (layouts, CSS/JS, fonts, KaTeX, Likely). The only site-level layout override is `layouts/partials/extra_head.html` for search-engine verification meta tags.

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

Automated via GitHub Actions (`.github/workflows/gh-pages.yml`). Push to `main` triggers: `npm ci` → `npm run translate` (Claude API) → commit EN translations → `npm run fetch-telegram-reactions` → `hugo --minify` → deploy to GitHub Pages. API key is stored in GitHub Secrets (`ANTHROPIC_API_KEY`). Telegram reactions step uses `continue-on-error: true` so a Telegram outage never blocks the deploy — the Hugo partials handle missing data gracefully. The "Translate content" and "Commit translations" steps are gated on `github.event_name == 'push' && github.ref == 'refs/heads/main' && github.event.head_commit.author.email != 'github-actions[bot]@users.noreply.github.com'` — the author-email check (rather than `github.actor`) is what reliably breaks the auto-translate bot loop, and the branch check keeps CI from touching anything on PRs.

## Architecture

- **Theme**: [hugo-mini](https://github.com/zavarovkv/hugo-mini) (git submodule at `themes/hugo-mini/`) — provides all base layouts, CSS, JS, fonts, KaTeX, Likely, shortcodes, i18n UI strings, and build scripts (`fetch-telegram-reactions.mjs`). The site does NOT shadow theme assets; fonts/katex/likely are served from the theme directly.
- **Site overrides** (one file in `layouts/partials/`):
  - `extra_head.html` — Yandex/Google verification meta tags
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
- EN content is auto-generated and committed by CI; do NOT manually edit files in `content/en/`

## Content

- Blog posts: `content/ru/blog/*.md` with TOML front matter (`+++`)
- Pages: `content/ru/consultation.md`, `content/ru/_index.md`
- EN equivalents: `content/en/blog/*.md`, `content/en/_index.md` (auto-generated)
- Front matter fields: `title`, `slug`, `date`, `description`, `categories`, optional `draft`, `telegram_post`, `math`, `mermaid`, `hidden`, `pinned`
- Posts are grouped by `categories` on the blog listing page; existing categories: Маркетинг, Стратегия и фреймворки, Метрики и аналитика, Команда и лидерство, Саморазвитие, Продуктивность, Подборки
- `pinned = true` in a post's front matter floats it to the top of its category group on the blog listing (chronological order is preserved among multiple pinned posts and among the rest)
- Markdown headings (`## `, `### `) get a clickable `#` anchor link via theme render hook — convert any inline `<h2>...</h2>` HTML in old posts to native markdown `##` so the hook can attach. Mobile: icon is hidden by default (`display: none`), tap heading to reveal it, tap icon to copy URL + scroll natively. `h2`/`h3` have `scroll-margin-top: 0.75rem` for breathing room after anchor navigation.
- `params.recentSidebarCount` in `config.toml` (or in `themes/hugo-mini/hugo.toml` default: 8) — controls how many recent posts appear in the sidebar/bottom block on single posts. The block is rendered by `partial "recent-posts.html"` which uses Hugo `return` to pass a slice; the caller in `single.html` places it inside `<aside class="recent-sidebar" id="recent-sidebar">`. On desktop with a wide-enough right gutter (≥ 180px) JS positions the aside absolutely in the gutter (`position: absolute`, scrolls with page). On mobile it renders as a static block at the bottom of the article using the same `ul.blog-posts` listing style.
- URL pattern: `/:slug/` for RU, `/en/:slug/` for EN (configured in `config.toml` permalinks)
- Text rule: never use the letter «ё» — always write «е» (its «её» → «ее», «еще» instead of «ещё»)

## Static Assets

All served locally (no CDN). Fonts, KaTeX, and Likely live in the theme (`themes/hugo-mini/static/`) and are served directly from there — the site used to shadow them with bit-identical copies, which is now removed. Theme CSS and JS are bundled, minified and fingerprinted via Hugo Pipes (`themes/hugo-mini/assets/css/main.css`, `themes/hugo-mini/assets/js/main.js`). The browser caches one `/css/main.min.<sha>.css` and one `/js/main.<lang>.min.<sha>.js` per language.

Theme-owned (do not duplicate in site):
- Inter font family (WOFF2 for 200/300/300italic/400/500/600/700; `@font-face` declares only the weights actually used: 300, 500, 600). 300 and 600 are preloaded in `baseof.html`.
- KaTeX math rendering (loaded conditionally on `math = true` in front matter).
- Ilya Birman's Likely social sharing buttons (loaded only on blog post pages).

Site-owned (`static/` in the blog repo):
- `CNAME` — GitHub Pages custom-domain file (`zavarov.com`).
- `data/` — post-specific datasets referenced from markdown (e.g. `retention-dataset.csv`).
- `images/` — avatars (`avatar1.webp`, `avatar2.webp`), post illustrations, favicons (`favicon.png` 32×32, `favicon-192.png` 192×192, `apple-touch-icon.png` 180×180), `og-default.png` base for dynamic OG image generation.

## Theme vs Site Overrides

`themes/hugo-mini/` is the project's own submodule — edit it directly. If a fix or change belongs to the theme (CSS, JS, layouts, partials, static assets inside the theme), apply it in the theme. Do not work around it with patches in `layouts/partials/extra_head.html` or by re-adding shadowed copies of theme assets. Site overrides exist strictly for site-specific concerns; currently the only one is `extra_head.html` for search-engine verification meta tags.

## Key Conventions

- Config file: `config.toml` (TOML format)
- Content front matter: TOML (`+++` delimiters)
- Markdown renderer: Goldmark with `unsafe: true` and math extensions enabled
- Primary content language: Russian; English auto-translated via Claude API
- Base URL: `https://zavarov.com/` (custom domain via GitHub Pages CNAME)
- Content license: CC BY-SA 4.0
