# Site operations

Build, translation and validation contracts for [zavarov.com](../README.md). Theme behavior is indexed in the [feature guide](../themes/hugo-mini/docs/advanced-features.md).

## Commands

```bash
hugo server                              # Start the development server
npm run dev                              # Refresh public counters and start Hugo
npm run build                            # Refresh public counters and build strictly
hugo --minify                            # Build the production site
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

## Content workflow

### CV

`content/ru/cv.md` maintains the Russian resume at `/cv/`. Its `noindex = true`
emits `noindex, follow` and excludes the page from the sitemap, while keeping
the URL accessible to visitors and crawlers so they can read that directive.
It uses the theme's
`resume` layout and `resume-entry` shortcode, with no blog navigation, footer,
back-to-top gutter or article widgets. Section headings, their rules and company
names use the shared `headingScroll` behavior, including URL fragments
and Option/Alt + Up/Down navigation. Clicking the person's name scrolls to the top
and clears the fragment without reloading or losing query parameters. Repeated
employers get distinct anchors through the `resume-entry` shortcode position.
CV sections use short explicit ASCII anchors to keep browser-PDF destinations
within format limits even for long Russian headings.
Keyboard navigation also reaches the final sections when the viewport is too
tall to align them at the top; manual scrolling resets its reference position.
Contacts and the professional role live in
front matter; phone and email are `tel:` / `mailto:` links at the upper right,
styled like ordinary text, with a pointer cursor and no hover color or underline.
There are no LinkedIn or homepage links. On mobile the name and role are followed by one row with
phone and email in two equal columns; below 320 px they stack vertically.
Each section heading ends in a thin rule. CV-specific screen and print styles
live in the theme's `assets/css/resume.css`, loaded only for this layout.
The complete experience, education, courses and mentoring stay in
the Markdown body. The initial content was transferred from the supplied Word
document without shortening or revising achievements.
Job headers contain the company, role and period; repeated Moscow labels and
company website links are omitted. The company is bold, the role is regular,
and the smaller period aligns at the upper right, including on ordinary phones.
On 360–600 px screens, the role sits directly below the company in the left
column, while the date spans both rows on the right. Start and end dates use
separate lines aligned at the left edge of that right-hand block. A two-line date therefore
does not create a blank line above the role. Desktop and print retain a full-width
role. Below 360 px, they stack in that reading order.
The gap before the job description is larger than the gaps within the header.
Screen company titles use 20 px, below the 22–24 px section headings.
The introduction keeps `IT-продукты` and `Ozon Travel` together. Its final sentence
uses `resume-mobile-paragraph` to start a new visual paragraph at 600 px and below;
desktop and print retain one continuous paragraph.
Experience entries lead with a product description, then a compact native
Markdown definition list for the objective and team, followed by a result list.
The two Yandex Travel products use compact level-four headings with short ASCII
anchors and the theme's `resume-product-heading` class inside one employment
entry, followed by their context and result groups; brief earlier roles remain prose. Context uses
16/24 px on screen, descriptions/results use 18/28 px, and key outcome metrics
are selectively bold. Sentence case, punctuation and number formatting are
normalized without removing achievements or changing quantities. Date ranges
and short number/unit combinations stay together with Beauty helpers or NBSP.
Result lists use Beauty's native `pretty` wrapping on screen, reducing isolated
last words where supported. Bold emphasis stays on the outcome values.
Education, courses and mentoring use the theme's
`resume-list` / `resume-item` shortcodes: regular-weight text, no visible bullets,
smaller dates at the right, stacked below 360 px. The mentoring section contains
the two Yandex Practicum roles; private consultations are omitted. On screens up
to 600 px, course providers and mentoring organizations appear below the title
at 16/24 px; desktop and print retain inline details. Institution names use
18 px regular text with the qualification directly below in a 16 px `subtitle`.
They are not headings or navigation stops. Active study uses “обучаюсь” alongside
the course provider, with only the year in the date column;
the HSE master's program records academic leave in its subtitle and uses
“2021 — н. в.” for the period. Current jobs also use “н. в.”. Screen pages have an extra
64 px of space at the end; print omits it and keeps individual records intact.

The page inherits the site's selected fonts and has no separate visible controls.
All text, links and rules share one ink color: black in light mode and print,
white in dark mode. Type size, font and weight establish hierarchy; the main professional role is bold. Use
the browser's Print command (`Cmd+P` on macOS / `Ctrl+P` elsewhere) and choose
Save as PDF for a current copy. The named A4 print layout uses 16 mm margins and a white background
and keeps entry headings with their text and individual result bullets together.
Printing also works without JavaScript. Turn off browser-added headers and footers for a clean copy.
There is no separate committed PDF to keep synchronized. Review every PDF page
after substantial content changes; pagination depends on fonts and browser settings.

The layout is reusable across languages. No English CV was generated
as part of this import; existing translation rules below still apply. See the
theme's [resume authoring guide](../themes/hugo-mini/docs/content.md#standalone-resume).

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
layouts/                 Site-specific search-engine verification
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
modules, OpenAI powers the optional translator, parsers validate content and local asset references,
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

Translations and the GitHub star snapshots are committed only after the build and link checks succeed. The build uses the workflow's existing GitHub token for star counts; an API failure keeps the committed snapshot. Link checks cover rendered relative and same-origin absolute URLs, resource query strings, HTML/SVG anchors, duplicate IDs, and empty builds. Local scripts and stylesheets with `integrity` metadata are also checked against their generated bytes, using the strongest advertised hash as browsers do. To verify a fresh build without stale local output, use `hugo --minify --destination /tmp/blog-check` followed by `npm run check -- --public-dir /tmp/blog-check` (choose an empty destination).

Set the `OPENAI_API_KEY` GitHub Actions secret to enable automatic translation. Without it, deployment continues using the committed EN content.

## Generated outputs

Each build produces:

- HTML pages in Russian and English
- RSS and JSON feeds
- `sitemap.xml` and `robots.txt`
- Localized `llms.txt`
- Open Graph and structured metadata

Russian pages use root-level URLs such as `/blog/` and `/:slug/`. English pages use the `/en/` prefix.

## Regression contracts

New translation responses must preserve fenced/inline code, math, destinations of links and images, shortcode tags, Mermaid bodies, and HTML structure/technical attributes. Prose, link labels and HTML `alt`, `title`, `aria-label`, and `placeholder` may be translated. A violation rejects the complete batch before writing a file or advancing its source hash. Existing hash-matched translations retain the metadata validation policy; this change does not trigger a bulk retranslation of historical content.

Resource checks include responsive `srcset`/`imagesrcset`, inline styles, stylesheet `url()`, `@import`, and `image-set()`. CSS paths resolve from the stylesheet; inline references honor the HTML base URL. Every emitted stylesheet is checked once. External URLs and embedded data are not fetched. This check does not parse JavaScript module graphs; browser tests exercise the pinned diagram modules, including failed downloads.

Install browsers once with `npx playwright install chromium webkit`, then run `npm run test:browser`. The suite uses an isolated build with the real blog configuration, shared theme contracts and representative RU/EN pages at 320, 390 and 1440 px in both color schemes. For the licensed profile, run `BROWSER_HUGO_CONFIG=config.toml,config/fonts/als-story.toml,config/fonts/sourdine.toml,config/fonts/mirta.toml npm run test:browser`. CI checks Inter on PRs and the selected production profile before deployment; no licensed fonts or traces are published as artifacts. `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome` selects installed Chrome locally.
