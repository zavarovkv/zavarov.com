# zavarov.com

Personal blog by [Konstantin Zavarov](https://zavarov.com) about Product Management — built with [Hugo](https://gohugo.io) and the [Bear Blog](https://github.com/janraasch/hugo-bearblog) theme.

## Quick Start

```bash
# Clone with theme submodule
git clone --recurse-submodules https://github.com/zavarovkv/zavarov.com.git
cd zavarov.com

# Run local dev server
hugo server
```

Open [localhost:1313](http://localhost:1313) to preview the site.

## Build

```bash
hugo --minify
```

Output goes to `/public`. Requires [Hugo extended](https://gohugo.io/installation/).

## Deploy

Automated via GitHub Actions — every push to `main` builds and deploys to GitHub Pages.

## Project Structure

```
content/          Blog posts (Markdown + TOML front matter)
layouts/          Custom template overrides
  partials/       Header, footer, styles, SEO, structured data
  shortcodes/     Custom shortcodes (plug, div)
static/
  fonts/          Inter font family (WOFF2)
  katex/          Math rendering (local KaTeX)
  likely/         Social sharing buttons
  images/         Avatars, favicon, OG image
themes/
  hugo-bearblog/  Base theme (git submodule)
config.toml       Site configuration
```

## License

All original content is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
The Hugo theme is licensed under the [MIT License](themes/hugo-bearblog/LICENSE).
