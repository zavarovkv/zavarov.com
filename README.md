# zavarov.com

Source code and content for [zavarov.com](https://zavarov.com) — Konstantin Zavarov's bilingual blog about product management.

Built with [Hugo](https://gohugo.io) and the [hugo-mini](https://github.com/zavarovkv/hugo-mini) theme.

## Local development

Requirements:

- Hugo Extended 0.146+
- Node.js 22+

```bash
git clone --recursive https://github.com/zavarovkv/zavarov.com.git
cd zavarov.com
npm ci
hugo server
```

The site will be available at <http://localhost:1313>.

If the repository was cloned without submodules:

```bash
git submodule update --init
```

## Commands

```bash
hugo server                              # Start the development server
hugo --minify                            # Build the production site
npm run translate                        # Translate new or changed content
npm run translate:force                  # Re-translate all content
npm run translate -- blog/brandage.md    # Translate one file
npm run fetch-telegram-reactions         # Update Telegram statistics
npm run vendor-mermaid                   # Refresh the local Mermaid bundle
npm run check                            # Validate content and local links
npm test                                 # Run regression tests without API calls
npm run translate -- --dry-run            # Inspect pending translations/deletions
npm run translate -- --allow-stale        # Keep existing EN if the API is unavailable
```

Translation requires an `OPENAI_API_KEY`.

## Content workflow

Russian content in `content/ru/` is the source of truth.

English pages in `content/en/` are generated with the OpenAI API. Do not edit them manually: translations are refreshed when the source hash changes. The exception is `content/en/_index.md`, which is maintained by hand.

Translation validates TOML and preserves every front-matter field except `title` and `description`. A failed response leaves the entire batch unchanged. Local translation commands fail by default; CI uses `--allow-stale` to warn and build with available translations when credentials are missing, the API fails, or a response is rejected. No EN files or hashes change in this fallback, so pending updates are retried on the next run. New posts may temporarily be available only in Russian. Source parsing, file writes, Hugo, and link checks remain strict.

Generated EN files whose RU sources were removed are pruned during a full successful run; manual pages and `_index.md` files are preserved. Pruning is also deferred if a translation batch fails.

Source hashes retain Markdown whitespace and normalize only CRLF line endings. `scripts/translation-baseline.json` is a fixed migration snapshot for the previous hashes: it avoids retranslating unchanged posts without rewriting existing EN files. Do not regenerate this snapshot after editing sources.

Posts use Markdown with TOML front matter:

```toml
+++
title = "Post title"
slug = "post-slug"
date = 2026-01-01
description = "Short description"
categories = ["Категория"]
+++
```

Optional fields include `draft`, `hidden`, `pinned`, `telegram_post`, `math`, and `mermaid`.

## Project structure

```text
content/                 Russian sources and English translations
static/                  Images, datasets, favicons, and CNAME
scripts/                 Translation and asset-vendoring scripts
layouts/_partials/       Site-specific head customization
i18n/                    Category name overrides
themes/hugo-mini/        Theme submodule
config.toml              Hugo and site configuration
```

Reusable layouts, styles, scripts, fonts, shortcodes, SEO templates, KaTeX, and social-sharing assets belong to the theme. Site-specific content and configuration remain in this repository.

## Deployment

Pushes to `main` are deployed to GitHub Pages through [GitHub Actions](.github/workflows/gh-pages.yml).

The workflow installs dependencies, updates English translations and Telegram statistics, builds the site, verifies self-hosted assets, and publishes `public/`.

Translations are committed only after the build and link checks succeed. Link checks cover rendered relative and same-origin absolute URLs, resource query strings, and HTML/SVG anchors. To verify a fresh build without stale local output, use `hugo --minify --destination /tmp/blog-check` followed by `npm run check -- --public-dir /tmp/blog-check` (choose an empty destination).

Set the `OPENAI_API_KEY` GitHub Actions secret to enable automatic translation. Without it, deployment continues using the committed EN content.

## Generated outputs

Each build produces:

- HTML pages in Russian and English
- RSS and JSON feeds
- `sitemap.xml` and `robots.txt`
- Localized `llms.txt`
- Open Graph and structured metadata

Russian pages use root-level URLs such as `/blog/` and `/:slug/`. English pages use the `/en/` prefix.

## License

Original content is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Site-specific content and assets follow the terms in [LICENSE](LICENSE). The hugo-mini theme is licensed separately under [MIT](themes/hugo-mini/LICENSE).
