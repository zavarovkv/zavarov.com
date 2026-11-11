# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Personal blog (zavarov.com) built with Hugo using the [hugo-mini](https://github.com/zavarovkv/hugo-mini) theme (git submodule). Multilingual: Russian (default) + English (auto-translated via OpenAI API). Content is focused on Product Management topics. Blog layouts, CSS/JS, fonts, KaTeX, and Likely live in the theme.

The concise feature map is in `README.md`; all site commands, translation guarantees and CI/check contracts are in `docs/operations.md`. Reusable theme features are indexed in `themes/hugo-mini/docs/advanced-features.md`. Keep these entry points current without duplicating full parameter references.

## Build & Development Commands

```bash
hugo server                              # Local dev server with live reload
hugo --minify                            # Production build (outputs to /public)
npm run translate                        # Translate new/changed content to EN
npm run translate -- --force             # Re-translate all content
npm run translate -- blog/brandage.md    # Translate specific file
npm run fetch-telegram-reactions         # Pull reaction/view counts from Telegram channel into data/telegram_reactions.json
```

The site requires Hugo Extended 0.154.5 or newer; the independent theme retains its 0.146.0 minimum. Translation requires `OPENAI_API_KEY` env variable. The Telegram reactions fetch script lives inside the theme (`themes/hugo-mini/scripts/fetch-telegram-reactions.mjs`) and is invoked via the npm alias above — it auto-resolves channel and content dir from Hugo config, including `module.mounts.sites.matrix`. `npm test` covers site and theme tests; `npm run check:syntax` checks all authored JavaScript.

## Deployment

Automated via GitHub Actions (`.github/workflows/gh-pages.yml`). Push to `main` triggers: `npm ci` → `npm run translate` (OpenAI API) → `npm run fetch-telegram-reactions` → `npm run build` (refresh GitHub stars, then build Hugo) → content/link/asset checks → commit EN translations and public counter snapshots → deploy to GitHub Pages. API key is stored in GitHub Secrets (`OPENAI_API_KEY`). Telegram reactions step uses `continue-on-error: true` so a Telegram outage never blocks the deploy — the fetch script also does its own per-post retry with exponential backoff and 429 Retry-After handling, and the Hugo partials handle missing data gracefully. The "Translate content" and "Commit generated updates" steps are gated on `github.event_name == 'push' && github.ref == 'refs/heads/main' && github.event.head_commit.author.email != 'github-actions[bot]@users.noreply.github.com'` — the author-email check (rather than `github.actor`) is what reliably breaks the auto-translate bot loop, and the branch check keeps CI from touching anything on PRs.

Homepage project stars use the theme's `github-stars` shortcode and `scripts/fetch-github-stars.mjs` helper. Counts live in site-owned `data/github_stars.json`. `npm run dev` and `npm run build` refresh them before Hugo; CI supplies its existing `GITHUB_TOKEN`. API failures preserve the saved count, and browsers make no counter requests. Plain Hugo commands use saved data only.

## Architecture

- **Blog theme**: [hugo-mini](https://github.com/zavarovkv/hugo-mini) (git submodule at `themes/hugo-mini/`) — provides the blog's base layouts, CSS, JS, fonts, KaTeX, Likely, shortcodes, i18n UI strings, and build scripts (`fetch-telegram-reactions.mjs`). The blog does not shadow theme assets; its fonts/katex/likely are served from the theme directly.
- **Blog override**: `layouts/_partials/custom_head.html` adds Yandex/Google verification meta tags. The theme uses Hugo's current template system (0.146+), so partials live under `_partials/` with the underscore.
- **Content mounts**: `module.mounts.sites.matrix.languages` selects Russian and English content. Keep explicit mounts for `layouts`, `assets`, `content/ru` and `content/en`; do not restore `mounts.lang` or duplicate the content selection with language `contentDir` settings.
- **Header title split**: the theme's `header.html` auto-splits `.Site.Title` on the first space into `.title-first-name` / `.title-last-name` spans (so `"Константин Заваров"` renders as two styleable pieces). No site override needed.
- **i18n**: site's `i18n/*.toml` contain only category display name overrides; all UI strings come from theme

## Multilingual (i18n)

- Hugo multilingual mode with directory-based content separation
- Russian (default): `content/ru/` — URLs at `/:slug/`, `/blog/`
- English: `content/en/` — URLs at `/en/:slug/`, `/en/blog/`
- `defaultContentLanguageInSubdirectory = false` — no `/ru/` prefix, existing URLs preserved
- UI strings: `i18n/ru.toml`, `i18n/en.toml` — templates use `{{ i18n "key" }}`
- Per-language menus configured in `config.toml` under `[languages.ru.menu]` / `[languages.en.menu]`
- Language switcher in footer uses Hugo's `.Translations` as ordinary links. The theme progressively remembers explicit choices with `rememberLanguage`. Language is applied automatically only on homepages; direct article URLs retain their language.
- hreflang tags in `<head>` for SEO
- Translation script: `scripts/translate.mjs` — Node.js, uses the official `openai` SDK and Responses API (`gpt-5.6-luna` by default, configurable via `OPENAI_MODEL`)
- EN content is auto-generated and committed by CI; do NOT manually edit files in `content/en/` — the script writes a `source_hash` (SHA-256 of normalized RU content) into the EN file's front matter and re-translates whenever that hash changes, so any manual EN edit will be overwritten on the next RU change. Use `--force` to re-translate regardless of hash. Exception: `_index.md` files are skipped by the script, so `content/en/_index.md` is maintained by hand.

The translator uses one retry loop (at most three requests per file), a two-minute request timeout and a batch budget of at least five minutes, scaled to two minutes per pending file for larger batches. It stops on the first terminal failure without publishing validated earlier files or pruning EN content; CI keeps using `--allow-stale`.

## Content

- Blog posts: `content/ru/blog/*.md` with TOML front matter (`+++`)
- Pages: `content/ru/consultation.md`, `content/ru/_index.md`
- Reading shelf: `content/ru/blog/books.md` uses site-owned `data/books.toml` and the theme's `reading-list` shortcode. Book reviews are regular `content/ru/blog/book-*.md` posts with `hidden = true`, so they remain indexable and in the sitemap without crowding article listings. Keep the existing `collections` category key, language-relative legacy `url` values and shared book metadata; see `docs/books.md`. The shelf's New badge depends only on a book's `added` date, never its article date. Use a compact two-column table: book details on the left, reading month aligned on the right, with the blog's shared typography.
- Book display strings live under each record's `translations.en`; `source_url` retains bibliographic verification without adding UI links. IDs, dates, years, ratings and review references remain shared. The English shelf and 26 reviews were prepared locally at the user's explicit request, with validated `source_hash` metadata. They build without an API; keep their translations synchronized when revising the Russian sources.
- EN equivalents: `content/en/blog/*.md` (auto-generated), `content/en/_index.md` (manual — the translate script skips `_index.md`)
- Front matter fields: `title`, `slug`, `date`, `description`, `categories`, optional `draft`, `telegram_post`, `math`, `mermaid`, `hidden`, `pinned`, `dropCap`. EN files additionally carry `source_hash` written by the translator (see Multilingual section).
- `editorialQuotes = true` gives native Markdown block quotations the shared Beauty figure treatment in RU/EN at render time. Explicit consultation/Kotler figures use the same styles. Short author definitions and the EdTech theorems use `beauty-lead` in both languages. See the theme typography guides; keep shared typography in Beauty and theme token configuration.
- `dropCap = true` opts an individual article into Beauty's opening-paragraph initial, using the theme's title font: two lines of wrapping with a quarter-line rise on desktop and mobile; print and unsupported browsers keep ordinary text. Select prose articles and substantial reviews with a full opening paragraph in both languages. Leave catalogs, templates, short leads, quotation collections and heading-first openings plain; also skip opening quotation marks or decorated first words. Keep the RU/EN choice synchronized without rewriting their prose. Publication credits use an upright `beauty-note` paragraph after the conclusion and before footnotes, with the publication name linked. See the theme's typography guides.
- `articleLinksNewTab = true` is enabled for post bodies only, including internal links. Same-page anchors and footnote navigation stay in place; menus, listings and standalone pages keep their existing behavior. Markdown targets are built by the theme; authored HTML/shortcode links are enhanced in the browser.
- `sideNotes = true` enables desktop margin notes through the theme while preserving mobile/print endnotes. A config cascade enables it for every blog article in both languages without editing translations. Typography remains in Beauty; the theme positions original notes, avoids collisions and preserves endnotes on narrow screens and in print.
- `hidden = true` excludes a post from listings, JSON feed, and `llms.txt` (but the page still renders at its permalink and is crawlable). Use for unlisted/evergreen pages linked only from specific posts.
- Local Markdown images get intrinsic dimensions from the theme. Existing raw HTML images should carry explicit `width` and `height`; `main img[width][height]` keeps their height responsive.
- `mermaid wide=true` expands selected diagrams, as in both Second Brain versions; its `caption` shares image-caption styling and the 720 px text measure.
- `wideCode = true` enables wide code blocks when they overflow the reading column on selected posts (RU/EN retention), sharing the image layout limits without changing source code or font sizes.
- Use the theme's `image` shortcode with `wide=true` for selected illustrations, as in the Russian CSPO article. It preserves the text's left edge and expands right up to 960 px, the source width and available space. Native figure/caption typography remains in Beauty. See `themes/hugo-mini/docs/content.md#wide-images`.
- Posts are grouped by `categories` on the blog listing page; existing categories: Маркетинг, Стратегия и фреймворки, Метрики и аналитика, Команда и лидерство, Саморазвитие, Продуктивность, Подборки
- Both manually maintained homepages place `latest-posts` and Projects inside the theme's `columns` shortcode; `column` groups the project heading and description. They sit side by side on desktop and stack on mobile. Each homepage requests the seven latest visible posts by date in the current language; `archive` / `archiveLabel` add the link to all articles. Projects list Hugo Mini's catalog entry and Beauty.css on npm.
- Projects use the theme's `project` shortcode: a linked name with a ↗ arrow, followed by a Markdown description. Project titles and the archive link use the standard medium content-link weight and inline label rules aligned with ordinary links. Decorative inline SVG arrows inherit the link color and scale with the text; their shape belongs to the theme and their size/alignment to Beauty. Description links and article-list links retain their light weight; each homepage project places its GitHub link and stars in a separate `beauty-note` paragraph below the description. Repository labels use inline underlines and their star counts share the text baseline.
- `pinned = true` in a post's front matter floats it to the top of its category group on the blog listing (chronological order is preserved among multiple pinned posts and among the rest)
- Markdown headings (`## `, `### `) get a clickable `#` anchor link via theme render hook — convert any inline `<h2>...</h2>` HTML in old posts to native markdown `##` so the hook can attach. Mobile: icon is hidden by default (`display: none`), tap heading to reveal it, tap icon to copy URL + scroll natively. `h2`/`h3` have `scroll-margin-top: 0.75rem` for breathing room after anchor navigation.
- URL pattern: `/:slug/` for RU, `/en/:slug/` for EN (configured in `config.toml` permalinks)
- Text rule: never use the letter «ё» — always write «е» (its «её» → «ее», «еще» instead of «ещё»)

## Static Assets

Blog fonts and KaTeX live in the theme's `static/`; Likely sources live in `assets/likely/` and Hugo minifies and fingerprints them only on pages with social sharing enabled. All these assets are self-hosted — the site used to shadow them with bit-identical copies, which is now removed. Theme CSS combines a pinned Beauty.css foundation with theme-owned `assets/css/main.css`; Hugo Pipes emits one minified, fingerprinted stylesheet. The generated foundation, upstream commit, checksum and license belong to the theme and are refreshed only by its `scripts/vendor-beauty.mjs` helper. The site does not load an npm package or CDN at runtime. The browser caches one `/css/main.min.<sha>.css` and one `/js/main.min.<sha>.js`; localized JS strings are passed through `body[data-i18n]`, so the bundle is shared across languages.

Shared native typography and editorial helpers belong to Beauty.css. The theme configures their `--beauty-*` variables and owns layout, UI components and font loading. Keep article markup free of inline font styling; use the library's editorial helpers or semantic Markdown. Do not copy base text rules into the theme or site. Local development snapshots use the theme helper's `--local` mode and must be replaced with a reviewed upstream pin before a theme release.

Screen footnotes use the body face and shared muted color at 15/24 px on desktop and 16/25.6 px on mobile; size/leading are configured with Beauty tokens. Footnote styling also belongs to Beauty.css (`beauty-footnotes`, `beauty-footnote-ref`, `beauty-footnote-backref`). Hugo Mini maps Goldmark's generated classes through `beauty-compat.html`; it does not duplicate note CSS. Use native Markdown footnotes, as in `nct.md` and `10-evils.md`. Ordinary list markers inherit the text weight and use the library's 0.875rem item gap (14 px) and responsive min(2.5rem, 8%) indentation; note spacing remains independently configurable.

Theme-owned for the blog (do not shadow these paths in the site):
- Inter font family (WOFF2 for normal 300/500/600 and italic 300, matching the active `@font-face` declarations; unused font files are not shipped). 300 and 600 are preloaded in `baseof.html`.
- KaTeX math rendering (loaded conditionally on `math = true` in front matter).
- Ilya Birman's Likely social sharing buttons (`assets/likely/`, minified and fingerprinted by Hugo, loaded only on blog post pages with sharing enabled).

Site-owned (`static/` in the blog repo):
- `CNAME` — GitHub Pages custom-domain file (`zavarov.com`).
- `data/` — post-specific datasets referenced from markdown (e.g. `retention-dataset.csv`).
- `images/` — avatars (`avatar1.webp`, `avatar2.webp`), post illustrations, and `og-default.png` for dynamic OG image generation. The main blog inherits the default asterisk favicon set from Hugo Mini.

Third-party runtime behavior:
- Mermaid is **self-hosted from a pinned npm dependency** (`12.2.0`), not a CDN or committed blob. `scripts/vendor-mermaid.mjs` copies `mermaid.esm.min.mjs` and its `.mjs` chunks into `static/js/mermaid/` during `postinstall`. `params.mermaidModuleSrc` selects that ESM entry. The theme retains `mermaidSrc` and its pinned CDN fallback for other consumers. Node.js 22.12+ and ES2024-capable browsers (Safari 17.4+) are required by Mermaid 12. The theme keeps Dagre/classic and `flowchart.wrappingWidth = 200`, `flowchart.minNodeWidth = 0` to preserve Mermaid 11 geometry; do not remove these explicit settings when upgrading.
- The browser prioritizes nearby Mermaid diagrams and prepares all remaining diagrams plus neutral print copies after load during idle time. Theme changes render offscreen and publish complete SVGs atomically. Printing switches synchronously to a cached neutral copy or readable source if preparation is unfinished; it never relies on awaiting `beforeprint`. Test animated edges, modern shapes, print and failed module loads when bumping the pinned version.
- Generated modules are gitignored. `npm ci`, `npm install`, or `npm run vendor-mermaid` regenerates them; the workflow checks the entry and the normal site check validates emitted local assets. A fresh clone must install npm dependencies to render diagrams.
- npm verifies dependencies against `package-lock.json`. Likely counters remain disabled; optional Yandex Metrika and Telegram comments still contact their services.
- Note: `npm` here is configured against a corporate Artifactory registry (`npm config get registry`), which may be unreachable outside the corporate network. `package-lock.json` resolves everything from `registry.npmjs.org`, and CI uses the public registry; locally, add `--registry https://registry.npmjs.org` if an install hangs.

## Theme vs Site Overrides

`themes/hugo-mini/` is the project's own submodule — edit it directly. If a fix or change belongs to the theme (CSS, JS, layouts, partials, static assets inside the theme), apply it in the theme. Do not work around it with patches in `layouts/_partials/custom_head.html` or by re-adding shadowed copies of theme assets. Blog overrides exist strictly for site-specific search-engine verification.

## Config Parameters

Site-level `[params]` in `config.toml` consumed by theme templates (see `themes/hugo-mini/layouts/` for usage):

- **Identity**: `authorURL`, optional `favicon` override (otherwise inherited from Hugo Mini), `avatar` / `avatarHover` (two-frame hover on header), `[params.author].jobTitle`, `[params.social]` (telegram, linkedin, github, email — rendered in footer and JSON-LD).
- **i18n UI**: `aiTranslatedLang` (language code whose footer gets the AI-translated sparkle icon; here `"en"`), per-language `authorName` / `description` / `title` under `[languages.<lang>.params]`.
- **Copyright/freshness**: `copyrightYear` (start year for the `YYYY–currentYear` range in footer), `newPostDays` (window in days for the "new" badge on listings).
- **Listing layout**: `socialSharing` (default true; set false to hide Likely bar on posts), `pinned` (front-matter, not params).
- **Analytics** (all optional; theme emits each block only if its ID is set): `yandexMetrikaId`, `googleAnalyticsId`, `plausibleDomain` / `plausibleSrc`, `umamiWebsiteId` / `umamiSrc`.
- **Telegram**: `telegramChannel` (channel slug used for post comments widget and reactions fetch).
- **llms.txt**: per-language `llms.about` under `[languages.<lang>.params]` — free-text author bio rendered in the theme's `home.llms.txt` output; contacts/sections/articles are derived from `params.social`, `menu.main`, and the blog section automatically.
- **Easter eggs**: `consoleArt` (multi-line string printed via `console.log` on page load; theme has `consoleYoda` as a default variant).

## Key Conventions

- Config file: `config.toml` (TOML format)
- Content front matter: TOML (`+++` delimiters)
- Markdown renderer: Goldmark with `unsafe: true` and math extensions enabled
- Primary content language: Russian; English auto-translated via OpenAI API
- Base URL: `https://zavarov.com/` (custom domain via GitHub Pages CNAME)
- Content license: CC BY-SA 4.0

## Working Preferences

- Browser integration: `npm run test:browser` builds an isolated copy using the real site config and reuses the theme's table/print/diagram contracts. Install Chromium and WebKit with `npx playwright install chromium webkit`. `BROWSER_HUGO_CONFIG=config.toml,config/fonts/als-story.toml,config/fonts/sourdine.toml,config/fonts/mirta.toml` selects the licensed local profile; PRs use Inter. Keep generated browser reports and private fonts out of Git and public artifacts.
- New translation responses validate protected body fragments before writing or hashing. Hash-matched historical translations keep their existing metadata check; do not trigger a bulk retranslation during technical work. Resource checks parse `srcset` and CSS references with their own URL bases; they make no external requests.
- Mobile heading links deliberately remain hidden until the heading is tapped. This is an accepted interaction; do not change it as an accessibility cleanup without a new user request.
- Article navigation is keyboard-only: Option/Alt + Left opens the older post, Right the newer post in the current language. Hugo Mini owns the behavior and generated neighboring URLs. Skip hidden posts and drafts, stop at both ends, and add no visible shortcut hints.

- For this user's own repositories, push small agreed changes directly to `main`; do not create a branch or PR for every commit unless explicitly requested.
- Keep commits focused and sequential. When a theme change is made, push `themes/hugo-mini` first, then commit and push the updated submodule pointer in this repository.
- Do not modify or regenerate translations unless the user explicitly asks; in particular, do not manually edit `content/en/`.

## Hugo Themes Catalog

- Hugo Mini's catalog submission, [gohugoio/hugoThemesSiteBuilder#698](https://github.com/gohugoio/hugoThemesSiteBuilder/pull/698), was merged on 2026-09-02. The theme is listed at https://themes.gohugo.io/themes/hugo-mini/.
- The supporting Roxo repository-path fix, [gohugoio/hugoThemesSiteBuilder#766](https://github.com/gohugoio/hugoThemesSiteBuilder/pull/766), was merged on 2026-08-17. Both catalog tasks are complete; there is no pending branch update or Netlify retry from that submission.
- The theme's Go module path is `github.com/zavarovkv/hugo-mini/v3`. Check the repository's current releases and this site's submodule pointer when reviewing versions; do not reuse the historical submission's release or commit snapshots.

## Optional licensed blog fonts

ALS Story is an opt-in site profile at `config/fonts/als-story.toml`; ordinary builds retain Inter. The generic loader and weight roles belong to Hugo Mini, while files in `assets/private-fonts/` and secret bundles in `.local/` are gitignored. Never commit these files or put them in the theme/Beauty. The deployment job restores Story and Sourdine when `BLOG_FONT=als-story`; the optional `BLOG_QUOTE_FONT=als-mirta` adds the verified Mirta bundle for all block quotations. Mirta Regular 400 uses `config/fonts/mirta.toml`; captions remain in Story and H1/drop caps in Sourdine. PRs use Inter. See `docs/site-fonts.md` before enabling or changing the profile.

Blog typography uses the theme’s `reading-layout`: 18/28 px and a 720 px column, 19/29 px on mobile. Narrow reading shelves retain a 20em minimum table width inside a labeled, keyboard-focusable Beauty scroll container; the page itself must not scroll horizontally. Display titles and Markdown table ISO dates are formatted by theme partials/render hooks, without editing translations or metadata.
