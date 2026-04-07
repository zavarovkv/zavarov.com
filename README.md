# zavarov.com

Personal blog by [Konstantin Zavarov](https://zavarov.com) about Product Management — built with [Hugo](https://gohugo.io). Multilingual (Russian + English). Layouts are inspired by [Bear Blog](https://github.com/janraasch/hugo-bearblog) but fully self-contained (no theme dependency).

## Quick Start

```bash
git clone https://github.com/zavarovkv/zavarov.com.git
cd zavarov.com

# Run local dev server
hugo server
```

Open [localhost:1313](http://localhost:1313) to preview the site.

## Build

```bash
hugo --minify
```

Output goes to `/public`. Requires [Hugo extended](https://gohugo.io/installation/).

## Translation

English translations are auto-generated from Russian content via Claude API:

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm run translate           # translate new/changed files
ANTHROPIC_API_KEY=sk-ant-... npm run translate:force      # re-translate everything
ANTHROPIC_API_KEY=sk-ant-... npm run translate -- blog/brandage.md  # specific file
```

In CI, translations are generated and committed automatically on every push to `main`.

## Deploy

Automated via GitHub Actions — every push to `main`:
1. Installs dependencies
2. Translates new/changed content via Claude API
3. Commits EN translations back to the repo
4. Builds with Hugo and deploys to GitHub Pages

Requires `ANTHROPIC_API_KEY` in GitHub Secrets.

## Project Structure

```
content/
  ru/                 Russian content (primary, written manually)
    blog/             Blog posts (Markdown + TOML front matter)
    _index.md         Homepage
    consultation.md   Consultation page
  en/                 English content (auto-generated, do not edit)
    blog/             Translated blog posts
    _index.md         Homepage
i18n/
  ru.toml             Russian UI strings
  en.toml             English UI strings
scripts/
  translate.mjs       Translation script (Claude API)
layouts/
  _default/
    baseof.html       Base HTML (analytics, KaTeX, hreflang tags)
    single.html       Blog post template (i18n dates, sharing, Telegram comments)
    list.html         Blog listing grouped by categories (2-column layout)
    index.json        JSON Feed template (auto-generated)
    sitemap.xml       Custom sitemap with per-page priorities
    home.llms.txt     LLM-friendly content index (auto-generated)
    _markup/
      render-link.html   Render hook: external links get target="_blank" at build time
      render-image.html  Render hook for images
  partials/
    header.html         Header with dual-state GIF avatar
    style.html          Main inlined CSS (dark/light theme)
    custom_head.html    Additional CSS (header, avatar, mobile menu, social)
    custom_body.html    JS (Likely, mobile menu, theme toggle)
    footer.html         Footer with social icons, language switcher, theme toggle
    posts-column.html   Single column of grouped posts for blog listing
    seo_tags.html       Meta tags (OG, Twitter Card, robots, canonical, og:locale)
    structured_data.html  JSON-LD schemas (BlogPosting, Person, BreadcrumbList)
    og-image.html       Dynamic OG image generation (1200x630)
  shortcodes/
    plug.html           Divider shortcode
  index.html            Homepage template
  404.html              404 page
static/
  fonts/              Inter font family (WOFF2, preloaded)
  katex/              Math rendering (local KaTeX)
  likely/             Social sharing buttons
  images/             Avatars, favicon, OG base image
config.toml           Site configuration (multilingual, per-language menus)
```

## Multilingual

- **Russian** (default): URLs at `/:slug/`, `/blog/`
- **English**: URLs at `/en/:slug/`, `/en/blog/`
- No `/ru/` prefix — existing Russian URLs are preserved
- Language switcher in footer links to the translated version of the current page
- hreflang tags for SEO cross-language linking

## SEO & AI Optimization

- **Structured data**: BlogPosting, Person, WebSite, BreadcrumbList (JSON-LD)
- **Meta tags**: Open Graph, Twitter Card, canonical, robots directives
- **hreflang**: Cross-language alternate links in `<head>`
- **Sitemap**: Custom template with differentiated priorities (home 1.0, sections 0.8, posts 0.7)
- **JSON Feed**: Auto-generated at `/index.json` for AI crawlers
- **llms.txt**: Auto-generated at `/llms.txt` — LLM-friendly site index with all blog posts
- **Semantic HTML**: `<article>`, `<time datetime>`, `<nav>`, `<main>`, `<header>`, `<footer>`
- **OG images**: Dynamically generated per page with title overlay
- **RSS**: Feed autodiscovery at `/index.xml`

## Output Formats

Hugo generates the following outputs on build:

| File | Format | Purpose |
|------|--------|---------|
| `index.html` | HTML | Main site |
| `index.xml` | RSS | Feed readers |
| `index.json` | JSON Feed 1.1 | AI crawlers, programmatic access |
| `llms.txt` | Plain text | LLM content discovery |
| `sitemap.xml` | XML | Search engine crawling |
| `robots.txt` | Plain text | Crawler directives |

## License

All original content is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
Layout code is licensed under [MIT](LICENSE).
