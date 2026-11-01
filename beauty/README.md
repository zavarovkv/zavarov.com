# Beauty.css examples in the blog

`/beauty/` and `/beauty/en/` are ordinary Hugo pages inside Hugo Mini's shared shell.
They use the blog's header, navigation, mobile menu, footer, fonts, width, color-scheme
control, code-copy buttons and SEO. There is no separate landing layout or stylesheet.

`layouts/beauty/single.html` renders the page body only. The 17 live specimens and their
HTML come from the same reviewed Beauty source. Palette values and the complete token
reference come from canonical CSS. Hugo's prose rewriting is disabled for these examples;
the original copy source lives in `data-code`, as it does for blog code blocks. This also
keeps copying exact if a CDN rewrites visible sample email addresses.

## Ownership

- Beauty owns the specimens in `site/catalog.mjs`, CSS, variables and illustration.
- `data/catalog.json` is the generated bilingual specimen/token snapshot, mounted at
  `data/beauty`. The host template owns the surrounding instructions and ordinary page markup.
- `public/` contains only exact downloadable CSS, its manifest/license and the specimen SVG.
  It does not contain standalone pages, navigation, styles or scripts from Beauty's demo.
- `assets/beauty/examples.js` at the blog root provides local form feedback. Shared behavior
  stays in the theme. Demo forms have no named submitted fields.
- Core typography and editorial treatments stay in Beauty; this module adds no CSS.

## Update and verify

After reviewing and pushing changes in Beauty, run from the blog root:

```sh
npm run vendor-beauty-site -- <full-reviewed-Beauty-commit-SHA>
hugo --minify --panicOnWarning
npm run check
node --test tests/beauty-site.test.mjs
```

The helper imports only reviewed specimen data, validates exact CSS checksums and records
every generated file in `upstream.json`. Normal Hugo builds need no upstream access, npm
installation or additional CSS toolchain. Commit the manifest, data and downloads together;
do not edit generated files. A local preview may use `--local ../beauty-css`, but CI requires
a published upstream commit. The npm release lifecycle remains independent.

Tests verify snapshot integrity, parity with the theme's pinned Beauty CSS, all examples,
shared blog assets and controls, source preservation, both language routes and sitemap entries.
Check desktop/mobile geometry, both themes, keyboard navigation and copying after UI changes.
