# zavarov.com

Source and content for [Konstantin Zavarov's blog](https://zavarov.com/) about product management. Built with [Hugo](https://gohugo.io/), [Hugo Mini](https://github.com/zavarovkv/hugo-mini) and [Beauty.css](https://github.com/zavarovkv/beauty-css).

## Included

- **Content:** Russian and English articles, projects, a bookshelf and a printable CV.
- **Reading:** responsive typography, light and dark modes, margin notes and print styles.
- **Rich posts:** quotations, code, math, diagrams and Telegram comments.
- **Discovery:** SEO, share cards, RSS, JSON Feed and localized `llms.txt`.
- **Delivery:** GitHub Pages, automatic translation and build, link and browser checks.

[Full feature index](themes/hugo-mini/docs/advanced-features.md). Full-text search is not implemented; the magnifier currently links home.

## Run locally

Requires **Hugo Extended 0.154.5+** and **Node.js 22.12+**.

```bash
git clone --recursive https://github.com/zavarovkv/zavarov.com.git
cd zavarov.com
npm ci
hugo server
```

Open <http://localhost:1313/>. Existing clones need `git submodule update --init`.
`npm ci` prepares Mermaid; building committed content needs no API key.

```bash
npm run build   # Refresh GitHub stars and build
npm test        # Site and theme tests
npm run check   # Validate generated pages, links and assets
```

## Fonts

Production uses **ALS Story** for text, **ALS Sourdine** for H1 and drop caps, and
**ALS Mirta** for quotations. Local builds use **Inter** by default.

Licensed fonts are not included in Git. See [font setup and deployment](docs/site-fonts.md).

## Ownership

- **Site:** content, data, configuration, translations and deployment.
- **Hugo Mini submodule:** layouts, UI, scripts, font loading and integrations.
- **Beauty.css:** shared typography, forms and tables.

Change shared behavior upstream: Beauty.css → theme → site's submodule pointer.
Russian articles are the source; English articles are generated. Both homepage `_index.md` files are maintained by hand.

## Documentation

- [Operations](docs/operations.md) — commands, translation, deployment and checks.
- [Bookshelf](docs/books.md) — book records, translations and reviews.
- [Fonts](docs/site-fonts.md) — licensed profiles and local preview.
- [Theme features](themes/hugo-mini/docs/advanced-features.md) — components and configuration.

Pushes to `main` deploy through [GitHub Actions](.github/workflows/gh-pages.yml).

## License

Original content is [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). See [LICENSE](LICENSE) for site assets and [the theme license](themes/hugo-mini/LICENSE) for Hugo Mini's MIT terms.
