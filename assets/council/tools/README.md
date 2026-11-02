# Service logos

Local SVG copies used to identify the tools listed on the Council landing.
The service names remain visible text; the marks are decorative and do not
indicate a partnership or endorsement. These trademarks belong to their owners.

Retrieved on 2026-11-02 from the owners' public assets:

| File | Source |
| --- | --- |
| `telegram.svg` | [Telegram media kit](https://telegram.org/tour/screenshots), `Logo.svg` from its [logo archive](https://telegram.org/file/464001088/1/bI7AJLo7oX4.287931.zip/374fe3b0a59dc60005) |
| `notion.svg` | [Notion's block logo](https://www.notion.so/images/notion-logo-block-main.svg), [media kit](https://notion.notion.site/Media-kit-4bd09326fb6a45b680aac5e639757372) |
| `google-workspace.svg` | [Google's gradient G](https://www.gstatic.com/images/branding/googleg_gradient/svg/googleg_gradient_standard_48px.svg); the [Workspace site](https://workspace.google.com/) uses the same G identity in its favicon |
| `linear.svg` | [Linear brand assets](https://linear.app/brand), `logo-dark.svg` from the [official archive](https://static.linear.app/design-assets/Linear-Brand-Assets.zip?v=3) |
| `github.svg` | [GitHub brand assets](https://brand.github.com/foundations/logo), `GitHub_Invertocat_Black.svg` from the [official archive](https://brand.github.com/GitHub_Logos.zip) |
| `miro.svg` | `logos/miro-logo.svg` from Miro's [@mirohq/brand-assets 1.1.2](https://www.npmjs.com/package/@mirohq/brand-assets/v/1.1.2), [source archive](https://registry.npmjs.org/@mirohq/brand-assets/-/brand-assets-1.1.2.tgz) |
| `cloudflare.svg` | [Cloudflare's cloud mark](https://developers.cloudflare.com/_astro/logo.te5VL_aD.svg) from the header of its [official documentation](https://developers.cloudflare.com/) |
| `chatgpt.svg` | ChatGPT's inline Blossom mark from the ChatGPT documentation header on [OpenAI Developers](https://developers.openai.com/); [brand guidelines](https://openai.com/brand/) |
| `todoist.svg` | Todoist's square inline symbol from the header of its [official site](https://www.todoist.com/) |
| `granola.svg` | [Granola's official 96px icon](https://www.granola.ai/favicon/favicon-96x96.png) from its [site](https://www.granola.ai/), embedded unchanged in a self-contained SVG wrapper |

Paths, view boxes and brand artwork are preserved. Export metadata is removed,
SVG IDs are prefixed per service to avoid inline collisions, and dimensions and
accessibility attributes are normalized. Linear, GitHub and ChatGPT's monochrome marks
use `currentColor` to follow the shared heading color in light and dark themes;
the other marks retain their original colors. Google's original SVG includes a
self-contained 48px PNG color layer behind a vector clip; it is preserved.
Todoist's `--white` fill is resolved to `#fff` so its mark is self-contained.
Granola provides a raster favicon (its official SVG also embeds a PNG); the
96px original is embedded locally without resampling or recoloring.
Google Workspace is identified by
the Google G beside the complete service name, not by the Drive icon.

The template minifies and inlines these reviewed local files. There is no remote
image request, runtime icon package or build-time download. When replacing an
asset, review the SVG and retain internal references only; do not embed scripts,
external resources or editor metadata.
