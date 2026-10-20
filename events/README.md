# Event landing pages

Standalone Hugo pages with their own layouts, CSS, scripts, fonts and share cards.
The root [config.toml](../config.toml) mounts this module alongside the blog. Events
use the site's URL, language, organizer, icons and analytics settings; they do not
load the blog theme. Event content is maintained manually, outside auto-translation.

## Create an event

Run from the repository root:

```sh
npm run event:new -- product-interviews
hugo server --buildDrafts
```

This creates `events/content/ru/product-interviews/_index.md` at
`/product-interviews/`. The generator rejects existing paths, slugs, aliases and
language prefixes. It never overwrites content.

Edit the title, description, topics, speakers and audience. Review the date: the
default is one week ahead. Set `draft = false` when the page is ready to publish.
The current layout is for Russian-language events within one Moscow calendar day.

## Configure

- **Schedule:** set `event_start` and `event_end` as ISO timestamps with `+03:00`.
  Visible dates, confirmation text and metadata are derived from these values.
  Keep `description` brief; the metadata adds the date and time automatically.
- **Registration:** set `registration_action` to the Google Forms submission URL
  and `registration_telegram_field` to the question's `entry.*` name. Both are
  required to show the form. Use `registration_note` to explain how attendees
  receive the event link.
- **Images:** place portraits and an optional `cover_image` beside `_index.md`.
  Portraits become 144×144 WebP files displayed at 72px; missing portraits use an
  icon. `image_crop` accepts a sequence of [Hugo crop operations](https://gohugo.io/methods/resource/crop/).
  Set `cover_image` to enable a 1200×630 share card; omit it for a text-only preview.
  Use `share_title` with `\n` for line breaks; the card fits two or three speakers.
- **Original files:** keep `[build] publishResources = false` to publish only the
  image variants referenced by the templates.

Google Forms responses load in a hidden iframe. The page can acknowledge sending
a request, but cannot verify that Google saved it. Tests never submit real answers.

To keep a page accessible by URL while excluding it from search and the sitemap:

```toml
noindex = true

[sitemap]
  disable = true
```

Remove both settings to restore indexing. Allow crawling in `robots.txt` so search
engines can read the `noindex` tag.

## Structure

| Path | Purpose |
| --- | --- |
| `content/ru/<slug>/` | Event data and source images |
| `layouts/event/landing.html` | Standalone HTML document |
| `layouts/_partials/events/` | Content, registration, schedule and metadata |
| `assets/` | Shared CSS, scripts, fonts and share-card background |
| `scripts/new.mjs`, `templates/webinar/` | Draft generator and starter content |
| `tests/`, `docs/` | Regression tests and asset provenance |

## Validate

```sh
npm run test:events
hugo --minify --panicOnWarning
npm run check
```

`npm test` also runs the blog's tests. Event tests cover registration behavior,
schedules, contacts, share cards and assets. An isolated build with a second event
verifies that the module works without the blog theme.
