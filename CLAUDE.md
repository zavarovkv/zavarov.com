# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog (zavarov.com) built with Hugo. Layouts are fully self-contained in this repo (no theme dependency). Multilingual: Russian (default) + English (auto-translated via Claude API). Content is focused on Product Management topics.

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

- **Layouts**: `layouts/` contains all templates — self-contained, no theme dependency
  - `layouts/index.html` — homepage template (renders `content/{ru,en}/_index.md`)
  - `layouts/404.html` — 404 page
  - `layouts/_default/baseof.html` — base HTML with Yandex.Metrika analytics, KaTeX math, Mermaid (deferred), hreflang tags
  - `layouts/_default/list.html` — blog listing grouped by category (delegates column rendering to `posts-column.html`)
  - `layouts/_default/single.html` — individual post with i18n date formatting, Likely social sharing
  - `layouts/_default/sitemap.xml` — custom sitemap with per-page priorities (home 1.0, sections 0.8, posts 0.7)
  - `layouts/_default/index.json` — JSON Feed 1.1 template for AI crawlers (auto-generated at `/index.json`)
  - `layouts/_default/home.llms.txt` — LLM-friendly content index (auto-generated at `/llms.txt`)
  - `layouts/_default/_markup/render-link.html` — markdown render hook; external links automatically get `target="_blank" rel="noopener noreferrer"` at build time
  - `layouts/_default/_markup/render-image.html` — markdown render hook for images (lazy loading, async decoding)
  - `layouts/partials/style.html` — main inlined CSS (dark/light theme support)
  - `layouts/partials/custom_head.html` — additional inlined CSS for header, avatar, mobile menu, social buttons, focus-visible, prefers-reduced-motion
  - `layouts/partials/custom_body.html` — JS: Likely init, mobile menu, theme toggle
  - `layouts/partials/nav.html` — main navigation with server-side active-link highlighting (`aria-current="page"`)
  - `layouts/partials/header.html` — header with dual-state GIF avatar (default + hover)
  - `layouts/partials/footer.html` — footer with social icons, language switcher (`.Translations` link), theme toggle
  - `layouts/partials/favicon.html` — favicon links (32×32, 192×192, apple-touch-icon 180×180)
  - `layouts/partials/posts-column.html` — single column of grouped posts for the blog listing (used twice by `list.html`)
  - `layouts/partials/seo_tags.html` + `structured_data.html` — SEO meta tags and JSON-LD schemas (BlogPosting, Person, WebSite, BreadcrumbList)
  - `layouts/partials/og-image.html` — dynamic Open Graph image generation (1200×630) via Hugo Resources API
  - `layouts/shortcodes/plug.html` — "* * *" divider
  - `layouts/shortcodes/caption.html` — image with caption wrapper
  - `layouts/shortcodes/mermaid.html` — Mermaid diagram wrapper (requires `mermaid = true` in front matter)

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
- Front matter fields: `title`, `slug`, `date`, `description`, `categories`, optional `draft`, `telegram_post`, `math`, `mermaid`, `hidden`
- Posts are grouped by `categories` on the blog listing page; existing categories: Маркетинг, Стратегия и фреймворки, Метрики и аналитика, Команда и лидерство, Саморазвитие, Продуктивность, Подборки
- URL pattern: `/:slug/` for RU, `/en/:slug/` for EN (configured in `config.toml` permalinks)
- Text rule: never use the letter «ё» — always write «е» (its «её» → «ее», «еще» instead of «ещё»)

## Static Assets

All served locally (no CDN):
- `static/fonts/` — Inter font family (WOFF2: 200, 300, 300italic, 400, 500, 600, 700), preloaded in `baseof.html`
- `static/katex/` — KaTeX math rendering (loaded conditionally on `math = true` in front matter)
- `static/likely/` — Ilya Birman's Likely social sharing buttons (updated via `npm run update-likely`)
- `static/images/` — avatars, post images, favicons (`favicon.png` 32×32, `favicon-192.png` 192×192, `apple-touch-icon.png` 180×180), `og-default.png` base for dynamic OG image generation

## Key Conventions

- Config file: `config.toml` (TOML format)
- Content front matter: TOML (`+++` delimiters)
- Markdown renderer: Goldmark with `unsafe: true` and math extensions enabled
- Primary content language: Russian; English auto-translated via Claude API
- Base URL: `https://zavarov.com/` (custom domain via GitHub Pages CNAME)
- Content license: CC BY-SA 4.0
