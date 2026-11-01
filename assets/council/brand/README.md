# Council symbol

`symbol.png` is the owner's selected monochrome symbol, prepared from:
https://chatgpt.com/s/m_6ae785807860819190630ace9ec60fc5

Hugo generates 32, 192 and 180 px application icons from this source. The header
uses the project name alone. Derived PNGs preserve alpha. An SVG favicon embeds
a 64 px PNG and
uses `prefers-color-scheme` to switch to white in dark browser chrome; PNG links
remain as fallbacks. The SVG has no external image dependency.

The supplied PNG had an opaque checkerboard. The built-in Imagegen tool removed
that background to produce the transparent source.

Editing prompt: remove only the baked-in gray checkerboard, including interior
gaps, replacing it with real transparent alpha. Preserve the emblem silhouette,
proportions, central pointed star, split outer ring, curves, color, orientation
and small canvas margins. No redesign, shadows, glow, outlines or text; use clean
antialiased edges and a square transparent PNG.
