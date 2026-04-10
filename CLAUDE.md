# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog (zavarov.com) built with Hugo using the [hugo-mini](https://github.com/zavarovkv/hugo-mini) theme (git submodule). Multilingual: Russian (default) + English (auto-translated via Claude API). Content is focused on Product Management topics. Site-specific overrides in `layouts/partials/` (header, extra_head only).

## Build & Development Commands

```bash
hugo server                              # Local dev server with live reload
hugo --minify                            # Production build (outputs to /public)
npm run translate                        # Translate new/changed content to EN
npm run translate -- --force             # Re-translate all content
npm run translate -- blog/brandage.md    # Translate specific file
```

Hugo extended version is required. Translation requires `ANTHROPIC_API_KEY` env variable.

## Deployment

Automated via GitHub Actions (`.github/workflows/gh-pages.yml`). Push to `main` triggers: `npm install` → `npm run translate` (Claude API) → commit EN translations → `hugo --minify` → deploy to GitHub Pages. API key is stored in GitHub Secrets (`ANTHROPIC_API_KEY`).

## Architecture

- **Theme**: [hugo-mini](https://github.com/zavarovkv/hugo-mini) (git submodule at `themes/hugo-mini/`) — provides all base layouts, CSS, JS, fonts, shortcodes, i18n UI strings
- **Site overrides** (only 2 files in `layouts/partials/`):
  - `header.html` — custom first/last name split for responsive styling
  - `extra_head.html` — Yandex/Google verification meta tags
- **i18n**: site's `i18n/*.toml` contain only category display name mappings; all UI strings come from theme

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
- Markdown headings (`## `, `### `) get a clickable `#` anchor link via theme render hook — convert any inline `<h2>...</h2>` HTML in old posts to native markdown `##` so the hook can attach
- URL pattern: `/:slug/` for RU, `/en/:slug/` for EN (configured in `config.toml` permalinks)
- Text rule: never use the letter «ё» — always write «е» (its «её» → «ее», «еще» instead of «ещё»)

## Static Assets

All served locally (no CDN):
- `static/fonts/` — Inter font family (WOFF2 files for 200/300/300italic/400/500/600/700; theme `fonts.html` declares `@font-face` for the weights actually used: 300, 500, 600). 300 and 600 are preloaded in `baseof.html`
- `static/katex/` — KaTeX math rendering (loaded conditionally on `math = true` in front matter)
- `static/likely/` — Ilya Birman's Likely social sharing buttons (updated via `npm run update-likely`)
- `static/images/` — avatars, post images, favicons (`favicon.png` 32×32, `favicon-192.png` 192×192, `apple-touch-icon.png` 180×180), `og-default.png` base for dynamic OG image generation

## Theme vs Site Overrides

`themes/hugo-mini/` is the project's own submodule — edit it directly. If a fix or change belongs to the theme (CSS, JS, layouts, partials inside the theme), apply it in the theme. Never work around it with patches in `layouts/partials/extra_head.html` or other site-level overrides. Site overrides exist strictly for site-specific concerns: `header.html` — custom name markup, `extra_head.html` — search engine verification meta tags only.

## Key Conventions

- Config file: `config.toml` (TOML format)
- Content front matter: TOML (`+++` delimiters)
- Markdown renderer: Goldmark with `unsafe: true` and math extensions enabled
- Primary content language: Russian; English auto-translated via Claude API
- Base URL: `https://zavarov.com/` (custom domain via GitHub Pages CNAME)
- Content license: CC BY-SA 4.0
