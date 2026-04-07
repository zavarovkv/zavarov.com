+++
title = "Second Brain: PARA × Obsidian × Granola × Claude"
slug = "second-brain"
date = "2026-03-07T00:00:00+03:00"
description = "How to build a knowledge management system from PARA, Obsidian, Granola, and Claude — and why it works like a second brain."
categories = ["Продуктивность"]
telegram_post = 69
mermaid = true
+++

A few years ago I was [organizing](/zettelkasten/) notes using the Zettelkasten method in VS Code. A lot has changed since then — largely due to the exponential growth of LLMs and agentic AI. I want to share my current tool stack, which helps reduce cognitive load and keep information from slipping through the cracks when time is scarce: <span class="underline">PARA × Obsidian × Granola × Claude</span>.

The article is called "Second Brain" — which means we're building a system that mirrors the structure of the human brain.

{{< mermaid >}}
graph LR
    S@{ shape: text, label: "Sound" }
    T@{ shape: text, label: "Text" }
    I@{ shape: text, label: "Images" }
    S e1@--> A[**Auditory Cortex**
    *Captures and processes sound*]
    T e2@--> B[**Visual Cortex**
    *Captures and processes visual input*]
    I e3@--> B
    A e4@--> C[**Hippocampus**
    *Routes and indexes information*]
    B e5@--> C
    C e6@--> mem
    mem e7@--> F[**Prefrontal Cortex**
    *Analysis, planning, decision-making*]
    e1@{ animate: true, curve: linear }
    e2@{ animate: true, curve: linear }
    e3@{ animate: true, curve: linear }
    e4@{ animate: true, curve: linear }
    e5@{ animate: true, curve: linear }
    e6@{ animate: true, curve: linear }
    e7@{ animate: true, curve: linear }

    subgraph mem[**Memory**]
        direction TB
        short[**Short-term**] <--> long[**Long-term**]
    end
{{< /mermaid >}}

{{< caption >}}Elements of brain structure{{< /caption >}} 

**PARA (Projects–Areas–Resources–Archives)** is a simple information organization model developed by [Tiago Forte](https://www.youtube.com/@TiagoForte). The idea is to split everything into four directories: active Projects, ongoing Areas, Resources as a document store, and Archives for completed projects. Tiago wrote an entire [book](https://www.amazon.com/PARA-Method-Simplify-Organize-Digital/dp/1668045567) about this model in 2023 — but in 2026, it's more efficient to just ask an LLM for the details.

**Obsidian** is a free tool for organizing notes in Markdown format. And for writing, it's leaps and bounds ahead of VS Code: live-preview document editing, a rich plugin ecosystem, and a mobile app. I'll keep VS Code for writing code and technical documentation, and use [Obsidian](https://obsidian.md/) for notes and knowledge management. It's simply more convenient — give it a try.

I'll admit, I get a particular kick out of the fact that maximum productivity today requires writing in Markdown, having basic terminal skills, finally figuring out what GitHub, [MCP](https://www.anthropic.com/news/model-context-protocol), [RAG](https://en.wikipedia.org/wiki/Retrieval-augmented_generation), [A2A](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/), and a whole bunch of other new AI technologies actually are. And I can see the same excitement in people who are close to the tech world. Tools that used to be exclusively for developers are going mainstream. Designers, marketers, and specialists from completely non-technical fields are showing up on GitHub — writing skills for agents and launching their own pet projects.

In 2025, [121 million new repositories](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/) were created on GitHub — a record in the platform's history.

 <img loading="lazy" src="/images/octoverse-genai-projects.webp" alt="GitHub Octoverse: repository growth on GitHub">

{{< caption >}}Number of repositories on GitHub{{< /caption >}} 

One more thing worth emphasizing: Markdown is a format that every LLM understands unambiguously — unlike .docx, .pdf, and other document formats. And it's not just headings and lists; here's the full [specification](https://spec.commonmark.org/0.31.2/#introduction). Markdown will outlive any tool. Evernote is dying, Notion will shut down someday, Google Docs is tied to an account — but an .md file will open in any text editor 20 years from now. It's plain text.

**Granola** is a service for recording, transcribing, and creating notes from meetings. It works on both smartphone and desktop, and handles both online and in-person meetings. It handles Russian exceptionally well. Funnily enough, [Granola](https://www.granola.ai/) outputs md-files (naturally), and one Obsidian enthusiast wrote a [Granola-to-Obsidian](https://github.com/dannymcc/Granola-to-Obsidian) plugin that syncs notes directly into your Obsidian workspace.

This raises an important information security question, especially when using the service for work. Transcription in Granola happens locally on your device — audio never leaves it. However, to generate the notes, Granola by default sends the transcript to ChatGPT. That's why I use an internal corporate LLM for that step.

**Claude Code** is an agentic AI with access to the file system — in our case, the Obsidian vault folder. It can read, edit, create, and analyze any files in that space. The name might suggest it's only for writing code, but that's not the case — it handles analysis and work on any text documents just as well. One interesting detail: you interact with Claude Code through the terminal. But trust me, it's intuitive enough that it won't cause any trouble.

<img loading="lazy" src="/images/obsidian-claude-scr.png" alt="Obsidian and Claude Code CLI">

{{< caption >}}Obsidian and Claude Code CLI{{< /caption >}} 

[Claude](https://claude.ai/) also has other interfaces: web, desktop, mobile app, and extensions for Chrome, Excel, and PowerPoint. They each serve their purpose, but none of them have direct access to files in the Obsidian vault — which means in the context of our smart stack, Claude Code is the key tool.

Which tasks to delegate to Claude is something everyone has to decide for themselves. My rule is simple: I only delegate what I can verify. Either I understand how to do it myself and Claude saves me time — or I know exactly what I want as output and can evaluate the result.

Incidentally, I'm writing this article in collaboration with Claude — he points out where the text sounds unclear or ambiguous, fixes typos, processes images and adjusts CSS styles, and helps with diagrams. Claude helped me migrate all my posts from an old WordPress blog to a new one built on [Hugo](https://gohugo.io/) in a single evening — something I'd been planning to do for ages, but before LLMs learned to write code, it felt like a heavy lift.

Worth noting: the files that Claude Code accesses are sent to external servers. But there are solutions for sensitive data: an [enterprise version](https://claude.com/product/claude-code/enterprise) where data stays within your infrastructure and is legally protected, or even a local setup with open-source models via [Ollama](https://ollama.com/).

Let's return to the analogy between this stack and the structure of the human brain:

{{< mermaid >}}
graph LR
    S@{ shape: text, label: "*Sound*" }
    T@{ shape: text, label: "*Text*" }
    I@{ shape: text, label: "*Images*" }
    S e1@--> A[**Auditory Cortex**
    Granola]
    T e2@--> B[**Visual Cortex**
    /Resources]
    I e3@--> B
    A e4@--> C[**Hippocampus**
    PARA]
    B e5@--> C
    C e6@--> mem
    mem e7@--> F[**Prefrontal Cortex**
    Claude Code]
    e1@{ animate: true, curve: linear }
    e2@{ animate: true, curve: linear }
    e3@{ animate: true, curve: linear }
    e4@{ animate: true, curve: linear }
    e5@{ animate: true, curve: linear }
    e6@{ animate: true, curve: linear }
    e7@{ animate: true, curve: linear }

    subgraph mem[**Memory**]
        direction TB
        Obsidian@{ shape: text, label: "Obsidian vault" } ~~~
        short[**Short-term**
        /Inbox
        /Projects] <--> long[**Long-term**
        /Areas
        /Archive]
    end
{{< /mermaid >}}

{{< caption >}}Stack mapped to brain structure{{< /caption >}} 

Each tool in the stack plays its own role: Granola captures incoming information streams (auditory cortex), PARA routes information (hippocampus), Obsidian stores knowledge (memory), and Claude Code analyzes and helps with decision-making (prefrontal cortex).

I arrived at this stack after a long period of experimentation and wrestling with the chaos of scattered storage — documents spread across a local drive, cloud services, Telegram saved messages, and various to-do apps. So far, things are running smoothly.