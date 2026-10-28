# zavarov.com

Source code and content for [zavarov.com](https://zavarov.com) — Konstantin Zavarov's bilingual blog about product management.

Built with [Hugo](https://gohugo.io) and the [hugo-mini](https://github.com/zavarovkv/hugo-mini) theme.

## Local development

Requirements:

- Hugo Extended 0.154.5+ (CI pins 0.154.5; the standalone theme supports 0.146+)
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
npm run dev                              # Refresh GitHub stars and start Hugo
npm run build                            # Refresh GitHub stars and build strictly
hugo --minify                            # Build the production site
npm run translate                        # Translate new or changed content
npm run translate:force                  # Re-translate all content
npm run translate -- blog/brandage.md    # Translate one file
npm run fetch-telegram-reactions         # Update Telegram statistics
npm run fetch-github-stars                # Update project star counts
npm run vendor-mermaid                   # Refresh the local Mermaid bundle
npm run check                            # Validate content and local links
npm run check:syntax                     # Check all authored JavaScript
npm test                                 # Test the site, events, and theme without API calls
npm run test:theme                       # Run only the theme's regression tests
npm run translate -- --dry-run            # Inspect pending translations/deletions
npm run translate -- --allow-stale        # Keep existing EN if the API is unavailable
```

Automatic translation requires an `OPENAI_API_KEY`. Building and previewing
the committed Russian and English pages does not require an API key.

## Content workflow

Russian content in `content/ru/` is the source of truth.

English pages in `content/en/` are committed translations. The optional OpenAI
workflow refreshes generated translations when the Russian source hash changes.
Do not edit generated files casually; `content/en/_index.md` is maintained by hand.
The restored bookshelf and its reviews were translated and reviewed locally.
They carry the same validated `source_hash` metadata and build without an API.

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

The homepage's inline `github-stars` shortcode reads `data/github_stars.json`. `npm run dev` and `npm run build` refresh the count from GitHub first; a GitHub failure preserves the last successful value. Plain Hugo commands use the saved data without a network request.

## Project structure

```text
content/                 Russian sources and English translations
data/                    Shared book records and saved GitHub star counts
events/                  Independent event content, layouts, assets and generator
static/                  Images, datasets, favicons, and CNAME
scripts/                 Translation and asset-vendoring scripts
layouts/_partials/       Site-specific head customization
i18n/                    Category name overrides
themes/hugo-mini/        Theme submodule
docs/                    Site content maintenance notes
tests/                   Site integration and script tests
config.toml              Hugo and site configuration
```

Reusable layouts, styles, scripts, fonts, shortcodes, SEO templates, KaTeX, and social-sharing assets belong to the theme. Site-specific content and configuration remain in this repository.

Language content is selected by explicit `module.mounts.sites.matrix` mounts;
`locale` and `label` use Hugo's current language configuration. Per-language
`params.ogLocale` preserves regional Open Graph values on older supported Hugo
versions. Keep the theme's minimum independent of the consuming site's version.

The reading shelf is documented in [docs/books.md](docs/books.md). Its reading
history is stored once; localized titles and authors are display overrides on
the same records. Reviews use ordinary Markdown and the shared article layout.

The four pinned npm dependencies are build/development tools: Mermaid supplies the local diagram
modules, OpenAI powers the optional translator, and parse5/smol-toml validate HTML and TOML.
The theme requires no npm installation, and its Beauty.css foundation has no runtime dependencies.
Sharing assets are minified and fingerprinted by Hugo only when sharing is enabled.

The 2026-10-28 dependency audit reports no moderate-or-higher npm findings. It retains a low-severity
KaTeX advisory through Mermaid; npm's automatic fix requires Mermaid 12, whose geometry and styling
change in compatibility tests. The theme's standalone KaTeX is updated to 0.18.2 with unchanged formula
appearance. Details and the regression check are documented in
[the theme's asset maintenance guide](themes/hugo-mini/docs/vendor-assets.md#katex).

## Deployment

Pushes to `main` are deployed to GitHub Pages through [GitHub Actions](.github/workflows/gh-pages.yml).

The workflow installs dependencies, updates English translations, Telegram statistics, and GitHub star counts, builds the site, verifies self-hosted assets, and publishes `public/`.

Pull requests run the same regression tests against Hugo 0.154.5 and the latest
release, including isolated builds of the event module. Deployment keeps the
pinned version so toolchain updates remain explicit.

Translations and the latest GitHub star snapshot are committed only after the build and link checks succeed. The build uses the workflow's existing GitHub token for star counts; an API failure keeps the committed snapshot. Link checks cover rendered relative and same-origin absolute URLs, resource query strings, HTML/SVG anchors, duplicate IDs, and empty builds. To verify a fresh build without stale local output, use `hugo --minify --destination /tmp/blog-check` followed by `npm run check -- --public-dir /tmp/blog-check` (choose an empty destination).

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
