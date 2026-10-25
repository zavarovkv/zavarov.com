# Reading shelf

The shelf is a regular article, `content/ru/blog/books.md`, at `/books/`.
It uses the existing `collections` category. The book records belong to the
site in `data/books.toml`; reusable rendering and freshness rules belong to
the theme. There are no site-level layout overrides or page-specific stylesheets
and browser scripts for books.

## Add a book

Append a record to `data/books.toml`:

```toml
[[items]]
id = "a-stable-short-id"
title = "Book title"
author = "Author name"
year = 2026
read = "2026-10"
added = "2026-10-25"
rating = 8.5

[items.translations.en]
title = "Published English title"
author = "Author's published name"
source_url = "https://publisher.example/book"
```

`id`, `title`, `author` and `read` are required. IDs must be unique.
`read` is the actual reading month, not an invented day. `year` and
`rating` are optional; omit an unknown rating rather than entering zero.
The rating scale is 0–10.

Keep reading dates, years, ratings, IDs and review references in the shared
record. Only display strings vary by language. Check English titles and
author names against publishers or library catalogs; use the original title
when no published English title has been confirmed. `source_url` records the
bibliographic source and is not displayed on the site.

`added` is the date a new read book enters the shelf. For
`params.newPostDays` days it enables the existing New badge on both that
book and the shelf article. The article's own publication date, editing an
old entry and restoring a review do not enable the badge. Imported historical
records deliberately omit `added`.

The shelf sorts by `read`, newest first, in a two-column table without year groups.
Each row shows the title above the author, publication year and optional rating.
Reading months align on the right. Long titles wrap naturally, including on mobile;
the table keeps the blog's fonts, colors and light link weight. Whitespace separates
rows. Both column labels share the theme's heading weight and color, with one
separator beneath the header. A section gap separates the final
book from the article's publication date and sharing controls.

## Add a review

Create `content/ru/blog/book-a-stable-short-id.md` as a normal Markdown post:

```toml
+++
title = "«Book title», Author name"
slug = "a-stable-short-id"
date = "2026-10-01T00:00:00+03:00"
date_precision = "month"
lastmod = "2026-10-25T00:00:00+03:00"
description = "A short description of the review."
url = "books/a-stable-short-id/"
hidden = true
categories = ["collections"]
+++

The review text.
```

Add `review = "/blog/book-a-stable-short-id"` to the matching record.
The shelf then links the title to the review. Review titles use the format
`«Book title», Author name`. Reviews contain ordinary Markdown and use the
same article template, fonts and styles as the rest of the blog. There are no
book-specific metadata blocks, shortcodes or styles on review pages.

Use native Markdown headings, lists and blockquotes. Do not paste the old
site's inline formatting, manual line breaks or captions for absent images.
Recommendations keep book titles as plain text; direct links to books and
stores are intentionally omitted. Reference and talk links may remain.

Set `date` to the book's reading month, using the first day for sorting.
`date_precision = "month"` shows only the known month and year on the page.
Keep the actual restoration or editing date separately in `lastmod`.

`hidden = true` keeps reviews out of article lists, recent posts and feeds.
They remain regular crawlable pages with canonical URLs, BlogPosting metadata
and sitemap entries. Do not add `noindex` or disable their sitemap entries.

Keep legacy `url` values, including underscores and other existing characters.
The missing leading slash is intentional: Hugo preserves the RU address and
can add the EN language prefix without overwriting it.

The English shelf and all 26 reviews are committed under `content/en/blog/`.
They were translated locally at the author's request. They use the existing
`prepareTranslation` helper to validate preserved front matter and store the
Russian `source_hash`; an unchanged source is skipped by the optional API
translator. Hugo reads these files directly, without making translation requests.
When revising the Russian text, review the English equivalent and refresh its
hash only after the translation is synchronized. Dates and formulas must stay intact.

## Archive recovery

The source is the author's [archived bookshelf](https://web.archive.org/web/20250623221237/https://zavarov.com/books/):
81 books and 26 linked reviews. Review bodies are restored as editable Markdown.
Their `archive_url` fields record the actual snapshots used. Publication dates
use the reading months from the old shelf; exact reading days and original
publication timestamps are unknown. `lastmod` records the restoration date.

The four illustrations referenced inside the old reviews could not initially
be retrieved from the archive. Their source URLs are retained in
`docs/books-missing-images.json` for recovery. The TED embed is a normal
link to the original talk.

Run `hugo server` to preview locally. Validate with `npm test`,
`node --test themes/hugo-mini/tests/*.test.mjs`, a production Hugo build and
`node scripts/check-site.mjs --public-dir <build-directory>`.

For bulk content imports, stop the development server before rewriting files,
write complete files atomically and restart with
`hugo server --renderToMemory --disableFastRender`.
Check the running pages over HTTP as well as the clean
production build: a successful disk build alone does not validate a live preview.
