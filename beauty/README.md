# Beauty.css documentation site

- Russian: `/beauty/`
- English: `/beauty/en/`

The site is authored in [Beauty.css](https://github.com/zavarovkv/beauty-css), not in
Hugo Mini. `site/catalog.mjs` owns the live specimens; `scripts/build-site.mjs`
renders each specimen and its escaped HTML from the same source. Palette values
and the complete token reference come from the library's canonical CSS.

`public/` is a generated snapshot mounted into `static/beauty`. It contains the
standalone HTML, both CSS entries, the documentation layout, a small optional UI
script, local illustration and MIT license. Hugo copies these bytes without
applying the blog theme, typography pass, fonts, analytics or translation workflow.
The two metadata pages under `content/` use `build.render = "link"` to register the
URLs in Hugo's language sitemaps without rendering competing HTML files.

## Update

Make and verify changes in Beauty first, then push its reviewed commit. From this
repository's root:

```sh
npm run vendor-beauty-site -- <full-reviewed-Beauty-commit-SHA>
hugo --minify --panicOnWarning
npm run check
node --test tests/beauty-site.test.mjs
```

The helper downloads only the builder's explicit inputs, verifies CSS checksums
and the license, and runs the reviewed builder with Node's built-in modules.
No npm installation or CSS toolchain is added to this blog. `upstream.json` records
the revision, version and every generated file checksum. Commit it together with
`public/`; never edit generated files by hand. A blog build or browser needs no
network request to Beauty or a CDN.

For joint local development, use `npm run vendor-beauty-site -- --local ../beauty-css`.
Replace this preview snapshot with a full published commit before pushing; CI
rejects unpinned snapshots. The library's npm release lifecycle stays independent.

## Validate

Beauty's own checks cover every public helper, all tokens, source copying, forms,
responsive layout and accessibility in Chromium, Firefox and WebKit. This repository
checks the snapshot, Russian/English routes, sitemap integration and a 25 KiB gzip
budget for initial HTML, CSS and JavaScript. The illustrative SVG is loaded lazily.
Forms have no named submitted fields, and demo JavaScript prevents submission.

The catalog follows the useful live-example/source pairing in
[Simple.css](https://simplecss.org/demo/) and keeps installation close to the start,
as in [Water.css](https://watercss.kognise.dev/). Its layout is independent of those
projects: a reading column, adjacent desktop contents and a native mobile disclosure.
