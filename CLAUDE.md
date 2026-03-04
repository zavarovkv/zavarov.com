# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog (zavarov.com) built with Hugo, using the hugo-bearblog theme (git submodule). Content is in Russian, focused on Product Management topics.

## Build & Development Commands

```bash
hugo server          # Local dev server with live reload
hugo --minify        # Production build (outputs to /public)
```

Hugo extended version is required. The theme is a git submodule — clone with `--recurse-submodules` or run `git submodule update --init`.

## Deployment

Automated via GitHub Actions (`.github/workflows/gh-pages.yml`). Push to `main` triggers build and deploy to GitHub Pages.

## Architecture

- **Theme**: `themes/hugo-bearblog/` (submodule) — base theme is never modified directly
- **Layout overrides**: `layouts/` contains all customizations over the base theme
  - `layouts/_default/baseof.html` — base HTML with Yandex.Metrika analytics, KaTeX math, scroll-to-top button
  - `layouts/_default/list.html` — blog listing grouped by category
  - `layouts/_default/single.html` — individual post with date formatting, tags, Likely social sharing
  - `layouts/partials/style.html` — main inlined CSS (light theme only, dark mode disabled)
  - `layouts/partials/custom_head.html` — additional inlined CSS for header, avatar, mobile menu, social buttons
  - `layouts/partials/custom_body.html` — JS: Likely init, external link handling, active nav highlighting, mobile menu, scroll-to-top
  - `layouts/partials/seo_tags.html` + `structured_data.html` — SEO meta tags and JSON-LD schemas
  - `layouts/partials/header.html` — header with dual-state GIF avatar (default + hover)
  - `layouts/shortcodes/plug.html` — "* * *" divider shortcode

## Content

- Blog posts: `content/blog/*.md` with TOML front matter (`+++`)
- Pages: `content/consultation.md`, `content/_index.md`
- Front matter fields: `title`, `slug`, `date`, `description`, `tags`, `categories`
- Posts are grouped by `categories` on the blog listing page
- URL pattern: `/:slug/` (configured in `config.toml` permalinks)

## Static Assets

All served locally (no CDN): Inter font family (`static/fonts/`), KaTeX math rendering (`static/katex/`), Likely social sharing buttons (`static/likely/`), images and avatars (`static/images/`).

## Key Conventions

- Config file: `config.toml` (TOML format)
- Content front matter: TOML (`+++` delimiters)
- Markdown renderer: Goldmark with `unsafe: true` and math extensions enabled
- All content is in Russian with Cyrillic font support
- Base URL: `https://zavarov.com/` (custom domain via GitHub Pages CNAME)
- Content license: CC BY-SA 4.0
