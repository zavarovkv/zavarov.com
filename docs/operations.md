# Site operations

Build, translation and validation contracts for [zavarov.com](../README.md). Theme behavior is indexed in the [feature guide](../themes/hugo-mini/docs/advanced-features.md).

## Commands

```bash
hugo server                              # Hugo only; does not refresh search
npm run dev                              # Refresh GitHub stars, start Hugo and watch the search index
npm run build                            # Refresh GitHub stars, build Hugo strictly and index search
npm run build:site                       # Build + index without fetching counters
npm run index-search                     # Reindex existing public/ output
hugo --minify                            # Hugo only; no search indexing
npm run translate                        # Translate new or changed content
npm run translate:force                  # Re-translate all content
npm run translate -- blog/brandage.md    # Translate one file
npm run fetch-telegram-reactions         # Update Telegram statistics
npm run fetch-github-stars                # Update project star counts
npm run vendor-mermaid                   # Refresh the local Mermaid bundle
npm run check                            # Validate content and local links
npm run check:syntax                     # Check all authored JavaScript
npm test                                 # Test the site and theme without API calls
npm run test:theme                       # Run only the theme's regression tests
npm run test:browser                     # Chromium/WebKit layout and print checks
npm run translate -- --dry-run            # Inspect pending translations/deletions
npm run translate -- --allow-stale        # Keep existing EN if the API is unavailable
```

Automatic translation requires an `OPENAI_API_KEY`. Building and previewing
the committed Russian and English pages does not require an API key.

## Search

Pagefind 1.6.0 indexes the generated HTML after every build. `npm run dev`
refreshes it after Hugo rebuilds; `npm run build` and `npm run build:site`
clean stale output, build and recreate `public/pagefind/`. CI uses this same
pipeline and publishes the whole directory. Plain Hugo commands do not run Pagefind.
Wait for **Search index updated**, then reload an open search after content edits.
For a missing local index, restart the preview with `npm run dev`; an HTTP 404 at
`/pagefind/pagefind-entry.json` confirms that the index is not being served.

The theme owns the dialog, index markers and build helper. Russian and English
results stay separate. Published articles and ordinary pages are included;
hidden/noindex/search=false pages, drafts, future/expired pages and site
navigation are excluded. `search = false` in front matter removes a page only
from local search. No translations or source hashes change during indexing.

Open with the magnifier, mobile menu, `Cmd/Ctrl+K` or `/`; arrows select results,
Enter opens and Escape closes. Search assets are self-hosted and loaded on demand.
Failed downloads show the ordinary empty state; Enter, editing or reopening retries.
See the theme's [search guide](../themes/hugo-mini/docs/search.md) for setup,
customization, hosting and language details.

## Content workflow

### Featured homepage articles

Both manually maintained homepage files use the theme's `featured-posts` shortcode.
Their `columns ratio="3:2"` gives articles 60% and projects 40% of the desktop
column space; mobile keeps the source order in a single column.
The shared `params.featuredPosts` list in `config.toml` selects the articles and their
display order for Russian and English:

```toml
[params]
featuredPosts = [
  "/blog/10-evils",
  "/blog/text",
  "/blog/brandage",
  "/blog/product-strategy",
  "/blog/nps-csi",
  "/blog/kotler",
]
```

Change this list to add, remove or reorder an article. References are Hugo content
paths, without a language prefix or file extension, rather than the public URLs.
The theme resolves each title and URL in the homepage's language and skips missing,
hidden and non-post pages; Hugo excludes drafts and future posts in production.
Duplicates appear only once. An empty or unavailable selection renders no block.

The link to all articles remains below the selection, and the full archive keeps
its existing category and date ordering. Changing this list does not modify article
front matter or trigger new translations. See the theme's
[featured articles reference](../themes/hugo-mini/docs/content.md#featured-articles).

### CV

`content/ru/cv.md` owns the resume at `/cv/`. Role and contacts live in front matter;
experience, education and mentoring remain in the Markdown body. `type = "resume"`
selects the site-owned templates and scopes their heading hook. `noindex = true`
keeps the page out of the sitemap and local search while leaving its URL accessible.

The CV belongs to this site, not Hugo Mini:

- `layouts/resume/single.html` reuses the theme shell, fonts and typography without navigation, footer or search.
- `layouts/resume/_shortcodes/resume-*.html` renders jobs and dated records.
- `layouts/resume/_markup/render-heading.html` formats only CV headings.
- `assets/css/resume.css` supplies the responsive layout and A4 print rules, loaded only on the CV.
- `tests/browser/resume*.mjs` and its local fixture check contacts, narrow screens, heading navigation and printing.

Keep short ASCII section IDs and the existing `resume-group-heading` result headings.
Company headings opt into the theme's generic `data-heading-scroll` behavior; clicking
the name clears the fragment. `backToTop = false` keeps the page free of that control.

Use **Cmd/Ctrl+P → Save as PDF**, with browser headers/footers disabled. Print uses
A4, 16 mm margins and the selected fonts; review every page after substantial edits.
There is no committed PDF or separately maintained English CV. Translation rules below apply.

### Translations

Russian content in `content/ru/` is the source of truth.

English pages in `content/en/` are committed translations. The optional OpenAI
workflow refreshes generated translations when the Russian source hash changes.
Do not edit generated files casually; `content/en/_index.md` is maintained by hand.
The restored bookshelf and its reviews were translated and reviewed locally.
They carry the same validated `source_hash` metadata and build without an API.

An explicitly requested structure-only cleanup may reuse the existing English
prose without an API call. Review each RU/EN pair's headings, lists, paragraphs,
footnotes and media; preserve translated captions, code comments and conventional
English book-title italics. Verify links, source code and front matter before
updating the reviewed file's `source_hash`; never advance hashes just to suppress
pending translations. Use native Markdown footnotes in both languages and check
that every reference resolves to the intended source.

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

Homepage projects show their GitHub link and stars in a separate compact `beauty-note` paragraph close below each description, with a larger gap between projects. The `github-stars` shortcode reads `data/github_stars.json`. `npm run dev` and `npm run build` refresh the count from GitHub first; a GitHub failure preserves the last successful value. Plain Hugo commands use the saved data without a network request.

## Project structure

```text
content/                 Russian sources and English translations
data/                    Shared book records and saved public counters
assets/private-fonts/    Ignored licensed fonts for the optional site profile
static/                  Images, datasets, and CNAME
scripts/                 Translation and asset-vendoring scripts
layouts/                 Search-engine verification and the custom CV
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

The reading shelf is documented in [docs/books.md](books.md). Its reading
history is stored once; localized titles and authors are display overrides on
the same records. Reviews use ordinary Markdown and the shared article layout.

The pinned npm dependencies are build/development tools: Mermaid supplies the local diagram
modules, Pagefind indexes search, OpenAI powers the optional translator, parsers validate content and local asset references,
and Playwright runs browser checks. The theme requires no npm installation for ordinary Hugo builds,
and its Beauty.css foundation has no runtime dependencies.
Sharing assets are minified and fingerprinted by Hugo only when sharing is enabled.

Mermaid is pinned to 12.2.0 in `package-lock.json`; CI audits npm dependencies on each run.
The theme explicitly retains Dagre, classic styling and the previous flowchart label widths, preserving
the existing diagrams' geometry instead of adopting Mermaid 12's ELK/neo defaults. Mermaid 12 requires
ES2024-capable browsers (including Safari 17.4+); loading failures leave readable diagram source.
The theme's standalone KaTeX remains at 0.18.2. Details and the regression check are documented in
[the theme's asset maintenance guide](../themes/hugo-mini/docs/vendor-assets.md#katex).

## Deployment

Pushes to `main` are deployed to GitHub Pages through [GitHub Actions](../.github/workflows/gh-pages.yml).

All external actions are pinned to reviewed commit SHAs and use the Node.js 24
action runtime. Site scripts continue to run on Node.js 22. Checkout credentials
are retained only in the publishing job that commits generated updates.

The workflow installs dependencies, updates English translations and public counters,
builds the site, verifies self-hosted assets, and publishes `public/`.

Pull requests run the same regression tests against Hugo 0.154.5 and the latest
release. Deployment keeps the pinned version so toolchain updates remain explicit.

Translations and the GitHub star snapshots are committed only after the build and link checks succeed. The build uses the workflow's existing GitHub token for star counts; an API failure keeps the committed snapshot. Link checks cover rendered relative and same-origin absolute URLs, resource query strings, HTML/SVG anchors, duplicate IDs, and empty builds. Local scripts and stylesheets with `integrity` metadata are also checked against their generated bytes, using the strongest advertised hash as browsers do. To verify a fresh build without stale local output, use `npm run build:site -- --destination /tmp/blog-check` followed by `npm run check -- --public-dir /tmp/blog-check` (choose an empty destination).

Set the `OPENAI_API_KEY` GitHub Actions secret to enable automatic translation. Without it, deployment continues using the committed EN content.

## Generated outputs

Each build produces:

- HTML pages in Russian and English
- RSS and JSON feeds
- `sitemap.xml` and `robots.txt`
- Localized `llms.txt`
- Pagefind search index in `public/pagefind/` when using the npm build commands
- Open Graph and structured metadata

Russian pages use root-level URLs such as `/blog/` and `/:slug/`. English pages use the `/en/` prefix.

## Regression contracts

New translation responses must preserve fenced/inline code, math, destinations of links and images, shortcode tags, Mermaid bodies, and HTML structure/technical attributes. Prose, link labels and HTML `alt`, `title`, `aria-label`, and `placeholder` may be translated. A violation rejects the complete batch before writing a file or advancing its source hash. Existing hash-matched translations retain the metadata validation policy; this change does not trigger a bulk retranslation of historical content.

Resource checks include responsive `srcset`/`imagesrcset`, inline styles, stylesheet `url()`, `@import`, and `image-set()`. CSS paths resolve from the stylesheet; inline references honor the HTML base URL. Every emitted stylesheet is checked once. External URLs and embedded data are not fetched. This check does not parse JavaScript module graphs; browser tests exercise the pinned diagram modules, including failed downloads.

Install browsers once with `npx playwright install chromium webkit`, then run `npm run test:browser`. The suite uses an isolated build with the real blog configuration, shared theme contracts and representative RU/EN pages at 320, 390 and 1440 px in both color schemes. For the licensed profile, run `BROWSER_HUGO_CONFIG=config.toml,config/fonts/als-story.toml,config/fonts/sourdine.toml,config/fonts/mirta.toml npm run test:browser`. CI checks Inter on PRs and the selected production profile before deployment; no licensed fonts or traces are published as artifacts. `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome` selects installed Chrome locally.

Quotation checks discover every RU/EN page containing quotations and register a separate test per page and color scheme, covering both mobile and desktop widths. Each page keeps the normal 30-second test budget; adding articles does not consume a single shared timeout for the entire collection.
