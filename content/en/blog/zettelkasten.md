+++
source_hash = "6e28b92326ea"
title = "The Zettelkästen Note-Taking Method"
slug = "zettelkasten"
date = "2023-03-12T12:00:00+03:00"
description = "The increasingly popular note-taking method from the extraordinarily productive German sociologist Niklas Luhmann."
categories = ["productivity"]
+++

<span class="underline">Zettelkästen</span> is an increasingly popular method of organizing notes and ideas, developed by the extraordinarily productive German sociologist [Niklas Luhmann](https://ru.wikipedia.org/wiki/Луман,_Никлас) — a man who, over the course of his life, authored more than 70 major academic books and 500 scholarly articles, and received prestigious doctoral honors and prizes for his contributions to sociology.

The Zettelkästen note-taking method helped Luhmann acquire new knowledge more effectively and engage in deep research. This gives rise to a compelling hypothesis: "If Zettelkästen helped Luhmann absorb new knowledge, it can help us too." All that's left is to put this promising hypothesis to the test.

Online discussions of Zettelkästen — in both English and Russian — only began to gain traction in 2020, following the publication of David Clear's article "[Zettelkasten — How One German Scholar Was So Freakishly Productive](https://writingcooperative.com/zettelkasten-how-one-german-scholar-was-so-freakishly-productive-997e4e0ca125)," which was also translated into Russian and published on [Habr](https://habr.com/en/post/508672/). This is despite the fact that Luhmann never kept his unique knowledge management method a secret — detailed descriptions of it in the original can be found in German academic journals from 1981 to 1987 ([originals in German](https://www.uni-bielefeld.de/soz/luhmann-archiv/pdf/jschmidt_zettelkasten-als-uberraschungsgenerator.pdf)).

<!--more-->

<img loading="lazy" src="/images/zettelkasten-luhmann.webp" alt="Никлас Луман">

 {{< caption >}}Niklas Luhmann{{< /caption >}} 

## The Core Idea

Zettelkästen is a method of storing ideas in individual cards — physical or digital — with connections established between them. Atomic, self-contained ideas, linked together, form chains of thought and serve as a engine for generating new ones.

[Here](https://niklas-luhmann-archiv.de/bestand/zettelkasten/inhaltsuebersicht) you can explore a portion of Niklas Luhmann's digitized idea cards and the connections between them.

<img loading="lazy" src="/images/zettelkasten-card.webp" alt="Карточка идеи Лумана">

 {{< caption >}}This is what an idea card looked like in the pre-digital era{{< /caption >}}


## Principles for Storing Ideas

1. **Atomicity and autonomy**. Each note contains one and only one idea — an idea that stands on its own and makes sense in isolation. This allows notes to be recombined freely without losing their meaning or usefulness.

2. **Interconnectedness**. Every note (idea) must contain at least one link to another existing note. A note with no connections exists outside the system — effectively, it doesn't exist at all. What's more, the connection between notes should be explained, so that a year or two later you can easily reconstruct why those ideas were linked.

3. **Intentionality**. The content of each note must be thought through by its author. Copy-pasting ideas from other sources is off the table. Restating the core idea in your own words — that's the way to go.

4. **Source attribution**. Every note should reference the original source of the idea. This preserves the integrity of the semantic relationships across the entire system.

5. **Anti-hierarchy**. There's no need to arrange notes into any kind of structure or hierarchy (as we're usually inclined to do). What matters are the associative links between ideas — not the structure itself.

## Markdown

The most versatile approach is to store ideas as plain text files in Markdown format, with the file base kept in a decentralized way — in the cloud, locally, or wherever works for you. Free, user-friendly Markdown tools exist for every major platform, and this approach keeps you flexible and free from tool lock-in.

That said, a fairly substantial (well, relatively speaking) collection of tools purpose-built for Zettelkästen can be found at [zettelkasten.de](https://zettelkasten.de/tools/).

After spending several days searching for the ideal tool, I settled on [VSCode](https://code.visualstudio.com) as my primary `.md` file editor, along with a set of plugins: [markdown memo](https://marketplace.visualstudio.com/items?itemName=svsool.markdown-memo), [nested tags](https://marketplace.visualstudio.com/items?itemName=vscode-nested-tags.vscode-nested-tags), and [markdown links](https://marketplace.visualstudio.com/items?itemName=tchayen.markdown-links). Together, they let me create tags, edit Markdown files comfortably, and visualize a graph of connections between notes.

<img loading="lazy" src="/images/zettelkasten-vscode.webp" alt="VSCode с настроенными плагинами для Zettelkästen">

 {{< caption >}}VSCode configured with plugins for Zettelkästen{{< /caption >}}