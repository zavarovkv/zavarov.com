+++
title = "The Zettelkasten Note-Taking Method"
slug = "zettelkasten"
date = "2023-03-12T12:00:00+03:00"
description = "The increasingly popular note-taking method from the extraordinarily prolific German sociologist Niklas Luhmann."
categories = ["Продуктивность"]
+++

<span class="underline">Zettelkasten</span> is an increasingly popular method for organizing notes and ideas, developed by the extraordinarily prolific German sociologist [Niklas Luhmann](https://ru.wikipedia.org/wiki/Луман,_Никлас), who over the course of his life managed to write more than 70 major academic books and 500 scholarly articles, and received prestigious doctoral honors and awards for his contributions to sociology.

The Zettelkasten note-taking method helped Luhmann acquire knowledge more effectively and engage in deep research. This gives rise to a hypothesis: "If Zettelkasten helped Luhmann absorb new knowledge, it can help us too." All that remains is to put this promising hypothesis to the test.

On English- and Russian-language resources, Zettelkasten only started gaining attention in 2020, following the publication of David Clear's article "[Zettelkasten — How One German Scholar Was So Freakishly Productive](https://writingcooperative.com/zettelkasten-how-one-german-scholar-was-so-freakishly-productive-997e4e0ca125)," which has also been translated into Russian on [Habr](https://habr.com/en/post/508672/). This is all the more surprising given that Luhmann never made a secret of his unique knowledge management method — a detailed description in the original can be found in German academic journals from 1981–1987 ([originals in German](https://www.uni-bielefeld.de/soz/luhmann-archiv/pdf/jschmidt_zettelkasten-als-uberraschungsgenerator.pdf)).

<!--more-->

<img loading="lazy" src="/images/zettelkasten-luhmann.webp" alt="Никлас Луман">

 {{< caption >}}Niklas Luhmann{{< /caption >}} 

## The Core Idea

Zettelkasten is a method of storing ideas on individual cards — physical or digital — and establishing connections between them. Atomic, self-contained ideas that are linked together form chains of thought and enable the generation of new ideas.

[Here](https://niklas-luhmann-archiv.de/bestand/zettelkasten/inhaltsuebersicht) you can browse a portion of Niklas Luhmann's digitized idea cards and their interconnections.

<img loading="lazy" src="/images/zettelkasten-card.webp" alt="Карточка идеи Лумана">

 {{< caption >}}This is what an idea card looked like in the pre-digital era{{< /caption >}}


## Principles for Storing Ideas

1. **Atomicity and autonomy**. Each note always contains one and only one standalone idea that is understandable on its own. This allows notes to be freely rearranged while preserving their meaning and usefulness.

2. **Interconnectedness**. Every note (idea) always contains at least one link to another existing note. An unlinked note exists outside the entire system — it simply doesn't exist. Moreover, the connection between notes must be explained, so that a year or two later you can easily reconstruct why those ideas were linked in the first place.

3. **Intentionality**. The content of each note must be thought through by its author. Copy-pasting ideas from other sources should be avoided entirely. Restating the core idea in your own words is the right approach.

4. **Source attribution**. Each note should reference the original source of the idea. This preserves the integrity of the semantic connections between all ideas in the system.

5. **Anti-hierarchy**. There is no need to arrange notes into any structure or hierarchy (as we typically tend to do). What matters are the associative links between ideas — not the structure.

## Markdown

The most versatile way to store ideas is to write them in plain text files using Markdown, with a decentralized file base stored in the cloud, locally, or wherever suits you. Free, user-friendly Markdown tools exist for all major platforms. This approach keeps your options open and frees you from dependence on any single tool.

That said, a decent (well, relatively speaking) number of tools designed specifically for Zettelkasten can be found at [zettelkasten.de](https://zettelkasten.de/tools/).

After spending several days searching for the best tool, I settled on [VSCode](https://code.visualstudio.com) as my main `.md` file editor, along with a few plugins: [markdown memo](https://marketplace.visualstudio.com/items?itemName=svsool.markdown-memo), [nested tags](https://marketplace.visualstudio.com/items?itemName=vscode-nested-tags.vscode-nested-tags), and [markdown links](https://marketplace.visualstudio.com/items?itemName=tchayen.markdown-links). Together, they allow you to create tags, edit Markdown files comfortably, and visualize a graph of connections between notes.

<img loading="lazy" src="/images/zettelkasten-vscode.webp" alt="VSCode с настроенными плагинами для Zettelkästen">

 {{< caption >}}VSCode configured with plugins for Zettelkasten{{< /caption >}}