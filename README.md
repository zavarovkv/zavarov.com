# zavarov.com

Source and content for [Konstantin Zavarov's blog](https://zavarov.com/) about product management. Built with [Hugo](https://gohugo.io/), [Hugo Mini](https://github.com/zavarovkv/hugo-mini) and [Beauty.css](https://github.com/zavarovkv/beauty-css).

## What is included

| Area | Features |
| --- | --- |
| Content | Russian articles and committed English translations; categories, pinned and hidden posts, homepage latest articles and New badges |
| Reading | 720 px text column; opt-in images, diagrams and long code blocks up to 960 px sharing its left edge; 18/28 px desktop and 19/29 px mobile text; light, dark and system colors; dedicated print layout |
| Typography | Shared RU/EN quotation styling through `editorialQuotes`, including native Markdown quotes, hanging opening marks and right-aligned attributions; `beauty-lead` for short author definitions and theorems; build-time punctuation and spacing; optical headings and narrow-screen title hyphenation; [raised initials with two-line wrapping](themes/hugo-mini/docs/typography.md#drop-caps) in selected prose articles and substantial reviews, matched across RU/EN; image descriptions and source credits; footnotes with stable leading and desktop margin notes in all articles that have footnotes (endnotes on narrow screens and in print); new-tab destinations in article bodies; scalable link arrows; scrollable tables; code highlighting and copying; optional KaTeX and Mermaid |
| Navigation | Clickable H1/H2 with preserved section URLs and Option/Alt + Up/Down navigation between headings; stable menu widths with smooth desktop selection, mobile menu, heading links, back-to-top and language choice; Option/Alt + Left/Right moves between older/newer articles without wrapping |
| Projects and books | Hugo Mini and Beauty.css project links with saved GitHub star counts; bilingual bookshelf and linked reviews |
| Integrations | Lazy Telegram comments, saved reactions/views, optional sharing and analytics |
| Discovery | Canonicals, language alternates, generated share cards, structured data, RSS, JSON Feed, sitemap, robots.txt and localized llms.txt |
| Delivery | GitHub Pages CI; protected batch translation, asset/link checks and Chromium/WebKit regression tests |

The magnifier currently links to the homepage; full-text search is not implemented. See the theme's [complete feature index](themes/hugo-mini/docs/advanced-features.md) for behavior and configuration.

## Run locally

Requires **Hugo Extended 0.154.5+** and **Node.js 22.12+**. The independent theme supports Hugo 0.146+.

```bash
git clone --recursive https://github.com/zavarovkv/zavarov.com.git
cd zavarov.com
npm ci
hugo server
```

Open <http://localhost:1313/>. For an existing clone, initialize the theme with `git submodule update --init`. `npm ci` prepares the self-hosted Mermaid modules; a build of committed content needs no API key.

```bash
npm run dev                 # Refresh GitHub stars and start Hugo
npm run build               # Refresh stars and build strictly
npm test                    # Site and theme regression tests
npm run check:syntax        # Authored JavaScript
npm run check               # Validate the generated public/ directory
npx playwright install chromium webkit
npm run test:browser         # Isolated browser fixtures
```

## Fonts

- **[ALS Story](https://www.artlebedev.ru/type/story/)** supplies body text and article-list links at 400, real italic at 400,
  and subheadings and emphasized text at Bold 700.
- **[ALS Sourdine Medium 500](https://www.artlebedev.ru/type/sourdine/)** supplies H1 and selected drop caps, with H1 at 44 px desktop / 32 px mobile and
  normal desktop letter spacing and compact mobile tracking. Lists and navigation keep Story.
- **[ALS Mirta Regular 400](https://www.artlebedev.ru/type/mirta/)** supplies block quotations
  in the optional quote profile. Attributions retain Story; featured testimonials use
  20/30 px on desktop and mobile in a column up to 640 px wide.
- **Inter** is the fallback setup when no private font profile is selected.

Font files stay outside Git in `assets/private-fonts/`. The site owns licensed assets
and family choices; Hugo Mini loads them and Beauty.css provides shared typography.
Production restores Story and Sourdine from separate, checksum-verified CI secret bundles.
Production also enables Mirta through its own secret bundle and `BLOG_QUOTE_FONT=als-mirta`.
The font files are never committed to the theme or the blog repository.

After preparing the files from the [font profile guide](docs/site-fonts.md), preview all three:

```bash
hugo server --config config.toml,config/fonts/als-story.toml,config/fonts/sourdine.toml,config/fonts/mirta.toml --port 1313
```

## Ownership

| Repository/layer | Owns |
| --- | --- |
| This site | `content/`, books and counter data, configuration, translation, resource checks and deployment; search-engine verification in `layouts/` |
| `themes/hugo-mini/` submodule | Layouts, UI, JavaScript, font loading, render hooks, shortcodes, SEO and integrations |
| Beauty.css, pinned by the theme | Native typography, forms, tables, lists, footnotes and reusable editorial styles |

Fix shared behavior in its owning repository. Do not duplicate theme assets or base typography in site overrides. Push Beauty changes first, pin the reviewed commit in the theme, then push the theme before updating this site's submodule pointer.

## Documentation

- [Operations](docs/operations.md) — all commands, content rules, translation guarantees, assets, CI and checks.
- [Bookshelf](docs/books.md) — shared records, localization, reading history and reviews.
- [Site fonts](docs/site-fonts.md) — local setup, licensed assets and production restoration.
- [Theme features](themes/hugo-mini/docs/advanced-features.md) — complete feature map and configuration links.
- [Technical audit](docs/technical-audit-2026-11-08.md) — historical findings and follow-up status.
- [Repository guidance](AGENTS.md) — implementation conventions and ownership boundaries.

Russian content is authoritative. Generated English articles are maintained by the translator; `content/en/_index.md` is manual. See [translation rules](docs/operations.md#content-workflow) before changing either.

Pushes to `main` run [GitHub Actions](.github/workflows/gh-pages.yml) and deploy to GitHub Pages. Translation API failures preserve the last committed English content; build, source and link errors still block deployment.

## License

Original content is [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). See [LICENSE](LICENSE) for site assets and [the theme license](themes/hugo-mini/LICENSE) for Hugo Mini's MIT terms.
