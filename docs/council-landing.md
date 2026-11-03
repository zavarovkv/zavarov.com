# Agent Council landing

The public RU/EN landing is owned by this Hugo repository:
- `/council/` — Russian
- `/en/council/` — English

The authenticated app remains on `https://council.zavarov.com`. The landing uses the app's existing Telegram Login endpoints; callbacks, token verification, sessions and secrets remain in the application.

## Source files

- `content/{ru,en}/council.md`: page metadata
- `layouts/council/single.html`: title, head, header, main, footer and script blocks extending Hugo Mini's shared page shell
- `layouts/_partials/council/content.html`: bilingual landing content and agent profiles
- `layouts/_partials/council/tools-data.html`: shared bilingual service catalog used by the tools section and integration counter
- `layouts/_partials/council/tools.html`: renders tool names and their roles in the workflow
- `layouts/_partials/council/models.html`: bilingual model names and their roles
- `assets/council/council.css`: scoped layout for the team grid, portrait rows, counters and tools
- `scripts/fetch-council-avatars.py`: copies approved 256×256 PNG portraits from a pinned public Agent Council commit to `static/council/avatars/` before Hugo builds

Typography, reading width, colors, links, fonts, footer controls and dark mode come from Hugo Mini and its pinned Beauty.css foundation. After the introduction, sections appear as counters, The team, How the team works, Tools, Models and Early access. The header links to Team, How it works, Tools and Early access, omitting the counters. Russian navigation labels are «Команда», «Как работает», «Инструменты» and «Ранний доступ». Mobile navigation reuses the theme's `menu-toggle.html` partial, `main-nav` styles and menu behavior; without JavaScript, the section links remain visible. The login link remains in the Early access section. Do not add native text styles or a separate palette to Council CSS. The introduction and sections share Beauty's 720px reading container, without a separate narrower introduction limit. The content uses a single localized `h1`;  Hugo Mini applies its language-aware prose spacing.

Card headings use `beauty-heading-compact`; the `beauty-steps` component owns step-heading spacing.
Visible compound names use nonbreaking hyphens; Russian one-letter prepositions and
conjunctions use nonbreaking spaces in the maintained copy. Section heading gaps are
shared. The header and portrait rows can wrap with enlarged text, and the
statistics grid keeps three columns with compact number formatting on mobile.

The footer calls the theme's `footer-content.html` with project-specific links: the [Agent Council repository](https://github.com/zavarovkv/agent-council) and [Qui-Gon on Telegram](https://t.me/Qui_Gon_Jinn_ai). It retains the shared language and color-scheme controls, without the blog's personal contacts or RSS link.

Portraits are fetched at build time, not by browsers from the application origin. The pinned source revision must be reviewed when portraits change. To preview locally, run `python3 scripts/fetch-council-avatars.py` before `hugo server`. The build fails if an image is unavailable or malformed rather than silently deploying broken cards.

The team order is Qui-Gon, Galen Erso (CTO), Dexter, Lando, Padmé and K-2SO
(technical auditor). Galen and K-2SO have owner-selected character identities and
generated portraits in `assets/council/portraits/`; prompts and provenance live in
that directory's README. Hugo emits 256×256 PNGs with alpha for the page, retaining
the full originals only in source control. The two upcoming agents have no visible
status label, at the owner's request; their cards do not claim runtime statistics.

The “How the team works” section follows one vertical sequence at all
viewport widths: planning, specialist work, coordinator review. Action-based
headings carry the meaning; each has one short explanation. Compact numbered
circles connected by a thin line show the sequence, with no interactive behavior
or completion status. The semantic ordered list retains
`role="list"`; decorative markers are hidden from assistive technology. Both
languages are maintained in the Council content partial. Typography comes from
Beauty's `beauty-steps` component, including marker placement, connecting lines and
the `beauty-step-marker` accent treatment. The page only arranges the overall sections.

The design was informed by the concrete workflows on [Dust](https://dust.tt/),
[Lindy](https://www.lindy.ai/), and [Relevance AI](https://relevanceai.com/), and
NN/g's guidance on [visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)
and [descriptive headings](https://www.nngroup.com/articles/layer-cake-pattern-scanning/).
The vertical treatment is a design choice for this narrow, editorial page, not
a claim that one layout is universally best.

## Tools

The Tools section sits between the workflow and Early access. It lists Telegram,
Notion, Google Workspace, Linear, GitHub, Miro, Cloudflare, Todoist and Granola with a short description of each
tool's role. Google Workspace groups files, email and calendar. This is an editorial
overview of the owner's selected tools, not a live connection or permission
status; the landing does not connect accounts or request access.

The section reuses the theme's `content-columns` layout and Beauty's
`beauty-heading-compact` and `beauty-note` typography. Council CSS only arranges
three columns on desktop and two on mobile. Small service marks sit beside the
names on desktop and above them on mobile to preserve the text column width.
Reviewed SVGs in `assets/council/tools/` are minified and inlined; their
[source notes](../assets/council/tools/README.md) record the official assets and
dark-theme treatment. No icon library, embedded widgets or external requests
are needed.

## Models

A small Models section follows Tools and precedes Early access. It lists GPT-6 Astra for complex tasks and analysis, GPT-6.1 Sol for everyday agent work, and Whisper for voice transcription. These roles are supported by the application's `docs/agent-profiles.md`, `docs/voice.md` and local STT command in `compose.yaml`. The section is maintained editorial copy, not a live model assignment feed. Use the full configured model names; show the provider mark in each model card and keep the section heading text-only. Future models may use a different provider mark. Omit per-agent assignments and any extra counter. It reuses Beauty's compact headings and notes and the same responsive grid as Tools, without adding a header navigation item.

## Early access

The final section invites visitors to request early access through Qui-Gon's
Telegram chat. `layouts/_partials/council/early-access.html` uses Beauty's existing
button and the landing's shared section spacing. The localized message is encoded
in Telegram's documented `text` query parameter; the visitor sends it in Telegram.
Opening the link does not enroll anyone or grant dashboard access. This is a
conversation-based request flow, with no form endpoint or on-page success claim.
An understated text link below the button lets invited visitors log in through
the application's Telegram login endpoint. Its `beauty-note` treatment
belongs to Beauty.css; the landing only sets the short gap below the primary action.
The Agent Council server captures explicit requests from the verified Telegram
queues and saves them to the connected Notion register once per minute, with
durable receipts and deduplication by Telegram ID. The maintained backend
[setup guide](https://github.com/zavarovkv/agent-council/blob/main/docs/waitlist.md)
describes matching, retries and operation. The existing invitation policy is
unchanged; collecting a request does not grant access.

## Public statistics

The “In numbers” block has no visible heading and sits above the team cards.
Its shorter 32–40px gap from the introduction groups the counters with the opening
copy. The regular 56–72px section gap before the team marks the next section.
These layout gaps belong to Council CSS; number typography remains in Beauty.
Its existing anchor and accessible section name remain in place, but the header
does not link to it.
It contains four totals: agents on the team, tasks completed, tokens used and MCP integrations. The integration count comes from the same service catalog as the Tools section, counting each listed service once; it is an editorial total, not the number of individual MCP commands or a live connection check. The agent count comes from the same roster that renders the
team cards, including all listed members; it is not a live-agent count from the API. No charts, per-agent breakdown, dates or explanatory copy appear in the
block. Counter tooltips retain the retrieval time and indicate a failed refresh.
Numbers and labels are centered within each counter's column, including the mobile scroll row. Numbers use Beauty's `beauty-stat-value` treatment; `beauty-stat-label` keeps their
labels quiet. Four columns show the totals on desktop. On mobile, a compact horizontally scrollable row sizes counters to their content with a 7rem minimum. The scrollbar is hidden while native touch and keyboard scrolling remain available; the next partially visible counter indicates more content. Native scrolling and proximity snap support touch, trackpads and keyboard focus without carousel JavaScript. Large totals use localized compact notation and `beauty-stat-unit` for
the suffix. Exact values remain in semantic `data` elements and their tooltips.
The template supplies the same unit scales to the live formatter; unknown counts
remain distinct from zero. The shared library owns sizing, weight and color.

`npm run fetch-council-statistics` reads the existing public
`https://council.zavarov.com/auth/login/council/team` endpoint, validates its
allowlisted agent IDs and counters, and saves summed totals and the retrieval time in `data/council_statistics.json`.
`npm run dev` and `npm run build` refresh
this snapshot; a failed refresh preserves saved values and timestamp. CI commits
it with other generated updates. Plain Hugo builds use the saved snapshot.

`layouts/_partials/council/statistics.html` renders all four counters without
JavaScript. On the application origin only, `assets/council/statistics.js`
refreshes the two activity counters on load and every five minutes while the page is visible, without
cookies or credentials. During the first request only, the two activity values use the theme's static `loading-skeleton` state with `aria-busy`; labels and the locally derived agent/integration totals stay visible. Success reveals current totals; failure reveals the saved snapshot. Background refreshes keep values visible, and without JavaScript the snapshot is always readable. Blog/local copies use saved HTML and need no CORS changes.
Missing counters produce an unknown total for that metric, never a partial total
or invented zero. Model names, configuration and other agent details are discarded. Token totals
use the source's input/output sum without adding cache/reasoning subsets again.
The app caches its source for five minutes; retrieval time is not collection time.
No chart dependency or history collector is needed.

## Telegram login

The Early access section uses an ordinary text link to
`https://council.zavarov.com/auth/login?provider=telegram-owner&next=%2Fprofiles`.
It works without JavaScript on every origin. The landing loads no Telegram SDK
and performs no nonce or session requests; the existing application owns the
Telegram sign-in flow, token verification and session creation.

## SEO

Shared theme partials render localized title/description, canonical, Open Graph,
Twitter, `hreflang` and JSON-LD. Council uses `WebPage` and `WebSite`, not article
dates. `config.toml` cascades canonical URLs for the two languages to the subdomain
and supplies the Agent Council site identity without editing translated content.
Blog copies stay crawlable but are excluded from the blog sitemap. The Council
virtual host owns `robots.txt` and the sitemap containing `/` and `/en/`; reciprocal
language alternates remain in each page. The page content and login link are
complete in HTML. The packager preserves the theme's JSON-LD and author identity.

## Deployment order

1. Complete blog CI and visual RU/EN/mobile review, with all six portraits present.
2. Use the artifact from the successful main build; verify both URLs and the sign-in link.
3. The workflow publishes the same static archive through the restricted receiver
   and `council-production` environment; see [deployment automation](council-deploy-automation.md).
4. Verify exact RU/EN hashes at the origin and the existing login/API checks. The
   server installer restores the previous static release if verification fails.

The server accepts only `index.html`, `en/index.html` and assets under `/council/`.
Keep that contract when changing the packager; application routes remain proxied
to Hermes. After successful blog publication, the same workflow automatically deploys its Council artifact. PR builds never deploy.

## Subdomain artifact

`python3 scripts/package-council-landing.py` packages the two rendered pages as `/` and `/en/`.
It keeps login on the application origin and maps only
Council page links and metadata to `council.zavarov.com`. HTML is parsed so minified, unquoted
attributes are handled correctly. CSS, JavaScript, portraits, header avatars, favicons, share
images and fonts referenced by stylesheets are included. Assets are relocated to
content-addressed `/council/assets/` paths, with the four runtime portrait paths
retained. CSS URLs and their SRI hashes are updated together; script bytes remain
unchanged. Missing, symlinked or oversized assets stop packaging before the archive
is written. Unused per-agent metrics and duplicate theme scripts are not shipped.

For an isolated build, pass `--public-dir /path/to/public --output /path/to/council-landing.tar.gz`.
Portraits and the generated archive are ignored by Git. The protected application routes and
its deployment remain outside this static artifact.

The header uses the project name alone. The favicon block explicitly selects an empty icon so the landing does not inherit the blog icon or request a default `/favicon.ico`. The workflow uses Beauty.css's `beauty-steps` component, including its marker placement, connecting line and text rhythm. Council CSS does not duplicate those rules.
