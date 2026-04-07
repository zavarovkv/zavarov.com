+++
title = "The Zettelkasten Method of Note-Taking"
slug = "zettelkasten"
date = "2023-03-12T12:00:00+03:00"
description = "The increasingly popular note-taking method from the extraordinarily productive German sociologist Niklas Luhmann."
categories = ["productivity"]
+++

<span class="underline">Zettelkasten</span> is an increasingly popular method of organizing notes and ideas, developed by the extraordinarily productive German sociologist [Niklas Luhmann](https://en.wikipedia.org/wiki/Niklas_Luhmann), who over his lifetime managed to write more than 70 major academic books and 500 scholarly articles, and received prestigious doctoral honors and prizes for his contributions to sociology.

The Zettelkasten note-taking method helped Luhmann acquire new knowledge more effectively and engage in deep research work. This gives rise to the hypothesis: "If Zettelkasten helped Luhmann absorb new knowledge, it can help us too." All that's left is to put this promising hypothesis to the test.

On English- and Russian-language resources online, Zettelkasten only started gaining attention in 2020, following the publication of David Clear's article "[Zettelkasten — How One German Scholar Was So Freakishly Productive](https://writingcooperative.com/zettelkasten-how-one-german-scholar-was-so-freakishly-productive-997e4e0ca125)," which has a Russian translation on [Habr](https://habr.com/en/post/508672/). This is despite the fact that Luhmann never kept his unique knowledge management method a secret — detailed descriptions of it in the original can be found in German journals from 1981 to 1987 ([originals in German](https://www.uni-bielefeld.de/soz/luhmann-archiv/pdf/jschmidt_zettelkasten-als-uberraschungsgenerator.pdf)).

<!--more-->

<img loading="lazy" src="/images/zettelkasten-luhmann.webp" alt="Niklas Luhmann">

 {{< caption >}}Niklas Luhmann{{< /caption >}} 

## The Core Idea

Zettelkasten is a method of storing ideas on individual cards — physical or digital — with links established between them. Atomic, self-contained ideas that are connected to one another form chains of thought and enable the generation of new ideas.

[Here](https://niklas-luhmann-archiv.de/bestand/zettelkasten/inhaltsuebersicht) you can browse a portion of Niklas Luhmann's digitized idea cards and their interconnections.

<img loading="lazy" src="/images/zettelkasten-card.webp" alt="Luhmann's idea card">

 {{< caption >}}This is what an idea card looked like in the pre-digital era{{< /caption >}}


## Principles for Storing Ideas

1. **Atomicity and autonomy**. Each note always contains one and only one self-contained idea that stands on its own. This allows notes to be freely combined while preserving their meaning and usefulness.

2. **Interconnectedness**. Every note (idea) always contains at least one link to another existing note. An unlinked note exists outside the system — it effectively doesn't exist at all. Moreover, the connection between notes should be explained, so that after a year or two you can easily recall why the ideas were linked in the first place.

3. **Intentionality**. The content of every note must be thought through by its author. Copy-pasting ideas from other sources should be avoided. Restating the core idea in your own words — good.

4. **Original source**. Every note should reference the original source from which the idea came. This preserves the semantic integrity of all the ideas in the system.

5. **Anti-hierarchy**. There is no need to arrange notes into any particular structure or hierarchy (as we're typically used to doing). What matters are the associative connections between ideas, not the structure.

## Markdown

The most versatile way to store ideas is to write them in plain text files using Markdown, with the file base stored in a decentralized way — in the cloud, locally, or wherever works best. Free and convenient Markdown editors exist for all major platforms. This approach gives you the freedom to choose your tools without becoming locked into any particular one.

That said, a fairly (well, relatively) large number of tools purpose-built for Zettelkasten can be found at [zettelkasten.de](https://zettelkasten.de/tools/).

After spending several days searching for the best tool, I settled on [VSCode](https://code.visualstudio.com) as my primary .md file editor, along with a set of plugins: [markdown memo](https://marketplace.visualstudio.com/items?itemName=svsool.markdown-memo), [nested tags](https://marketplace.visualstudio.com/items?itemName=vscode-nested-tags.vscode-nested-tags), and [markdown links](https://marketplace.visualstudio.com/items?itemName=tchayen.markdown-links). Together, they allow you to create tags, comfortably edit files in Markdown, and build a graph of connections between notes.

<img loading="lazy" src="/images/zettelkasten-vscode.webp" alt="VSCode configured with Zettelkasten plugins">

 {{< caption >}}VSCode configured with Zettelkasten plugins{{< /caption >}}