+++
source_hash = "b27c1c016627db9d660aa51c7609f273b19b2d64f6e9a1b8f976e7135bb1ac5a"
title = "Hugo Mini, a minimalist blog theme without a frontend framework"
slug = "hugo-mini-theme"
date = "2026-11-06T07:00:00+03:00"
description = "How I built Hugo Mini, an open-source blog theme with build-time typography, multilingual pages and self-hosted assets, and how to run it locally or on Vercel."
categories = ["productivity"]
draft = true
+++

A few years ago I wrote on WordPress. Then I moved [my blog](https://zavarov.com/) to [Hugo](https://gohugo.io/), a static site generator. Each article lives in an ordinary Markdown file, and Hugo builds the finished page before anyone visits it.

Over time, my templates, configuration and ideas about how a blog should read grew into a theme of their own. I published [**Hugo Mini**](https://github.com/zavarovkv/hugo-mini) on GitHub, and you can now find it in the [Hugo Themes catalog](https://themes.gohugo.io/themes/hugo-mini/).

Here’s how the theme works, why it can run without a frontend framework, how it handles fonts and languages, and what it takes to start a blog with it.

## 1. A blog starts with the writing

It’s easy to get caught up in the interface when you build a personal site. One more animation, one more widget, another library or build tool. Soon, publishing a short note means maintaining a small product.

I wanted to write in Markdown, save the file, push it to Git and have a page people could read. That meant doing without an admin panel, a database or a client app readers had to download before the text appeared.

Hugo already works this way:

```text
content/blog/article.md
         ↓
   Hugo + layouts/
         ↓
   public/article/index.html
```

The server delivers static HTML. You can read most of the page with JavaScript turned off, keep the blog on GitHub and move it between hosts.

Mini still supports a dark theme, RSS, search metadata, Open Graph previews, formulas, diagrams and comments. Each feature loads where it’s needed.

## 2. Designing for the reader

Mini uses its own Hugo templates and [Beauty.css](https://github.com/zavarovkv/beauty-css), a small, independent typography library. The design starts with line length, spacing, headings and links. The Inter font ships with the theme, so the browser can fetch it from the same host as the page.

On a large screen, the reading column is about 720 px wide. On a phone, the page keeps 20 px side margins and the text stays flush left. Long lines are tiring to follow, and justified text can leave wide gaps between words on a narrow screen.

A quieter feature is **build-time typography**. Hugo applies language-specific rules. In Russian, for example, it keeps a number and its unit on the same line. The original Markdown stays as written, including code, links and formulas.

That’s what I want from a personal publishing tool. Once I’ve decided how a detail should work, I’d like to stop thinking about it each time I publish.

## 3. What loads on a page

It’s tempting to add a package for a single convenient feature. I tried to keep the cost of each feature on the pages that use it.

- **Stylesheets and fonts** are self-hosted. Hugo combines and minifies the CSS. When it changes, a new hash in the filename tells the browser to fetch the new version.
- **Dark mode** follows the system preference and can remember a reader’s choice.
- **KaTeX and Mermaid** load only on pages that use formulas or diagrams.
- **Telegram comments and analytics** stay off until the author configures them.

A reader opening an ordinary essay shouldn’t have to download a diagram renderer.

Link previews are another good job for the build step. The theme can generate an Open Graph image when it builds the site, which saves me from designing a card for every short post.

## 4. One blog in two languages

I keep Russian and English content in separate directories. Hugo builds a page for each language, and Mini adds a language switcher and `hreflang` links for search engines.

Each version has its own URL and HTML. A reader can share a link to the English article, and a search engine or archive can retrieve that same version directly.

My blog has a separate GitHub Actions workflow for translating articles. **The theme itself needs no API key.** It displays whichever language versions the author provides.

## 5. Start your own blog

The [live demo](https://hugo-mini-demo.vercel.app/) is a working example you can explore. It has sample articles and pages of its own.

For a quicker start, the [starter includes a Deploy to Vercel button](https://github.com/zavarovkv/hugo-mini/tree/main/starter). It copies a minimal site into a new repository and deploys it. Then you can change the title, edit the About page and write your first article.

To run it locally, install Hugo Extended 0.146 or later:

```bash
hugo new site myblog
cd myblog
git init
git submodule add https://github.com/zavarovkv/hugo-mini.git themes/hugo-mini
```

Set `theme = "hugo-mini"` in `hugo.toml`, add a Markdown file to `content/blog/` and run `hugo server`. The [project README](https://github.com/zavarovkv/hugo-mini#quick-start) has a complete minimal configuration.

The starter pins the theme to a release and verifies its Git commit SHA. The Vercel build also downloads Hugo from an official release and verifies its SHA-256 checksum. A routine rebuild uses the same versions.

## 6. Where Mini fits

I built Mini for personal publishing. For a store, a drag-and-drop page editor or a portal with dozens of interactive components, I’d choose a different tool.

There’s also a trade-off in the optional integrations. The core site is static and self-contained. Enabling Telegram comments, analytics or certain other features adds requests to external services.

For a personal blog or a collection of technical notes, that balance works for me. There’s **less infrastructure between an idea and a published piece**.

---

Hugo Mini is available under the MIT license. You can use it in your own projects, adapt it, send a fix or suggest an idea on GitHub.

- [Source code and setup instructions](https://github.com/zavarovkv/hugo-mini)
- [Live demo](https://hugo-mini-demo.vercel.app/)
- [Hugo Themes catalog](https://themes.gohugo.io/themes/hugo-mini/)

If you use Mini, I’d appreciate a star on GitHub. It helps other writers find the theme and tells me it’s worth developing further.
