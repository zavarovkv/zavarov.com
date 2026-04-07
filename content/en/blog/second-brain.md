+++
title = "Second Brain: PARA × Obsidian × Granola × Claude"
slug = "second-brain"
date = "2026-03-07T00:00:00+03:00"
description = "How to build a knowledge management system from PARA, Obsidian, Granola, and Claude — and why it works like a second brain."
categories = ["Productivity"]
telegram_post = 69
mermaid = true
+++

A few years ago I [organized](/zettelkasten/) my notes using the Zettelkasten method in VS Code. A lot has changed since then — largely due to the exponential growth of LLMs and agentic AI. I want to share my current tool stack, which helps reduce cognitive load and keep information from slipping through the cracks when time is scarce: <span class="underline">PARA × Obsidian × Granola × Claude</span>.

The article is called "Second Brain," which means we're building a system that mirrors the structure of the human brain.

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

**PARA (Projects–Areas–Resources–Archives)** is a simple information organization model developed by [Tiago Forte](https://www.youtube.com/@TiagoForte). The idea is to split everything into four directories: active Projects, long-term Areas, Resources as a document store, and Archives for completed projects. Tiago wrote an entire [book](https://www.amazon.com/PARA-Method-Simplify-Organize-Digital/dp/1668045567) about this model in 2023, but in 2026 it's more efficient to just ask an LLM for the details.

**Obsidian** is a free tool for organizing notes in Markdown format. It's far more comfortable for working with text than VS Code: live-preview document editing, a rich plugin ecosystem, and a mobile app. I'll keep VS Code for writing code and technical documentation, and use [Obsidian](https://obsidian.md/) for notes and building a knowledge base. It's simply more convenient — give it a try.

I'll admit, there's something I genuinely love about the fact that maximum productivity today requires writing in Markdown, having basic terminal skills, finally figuring out what GitHub, [MCP](https://www.anthropic.com/news/model-context-protocol), [RAG](https://en.wikipedia.org/wiki/Retrieval-augmented_generation), [A2A](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/), and a whole host of other new AI-adjacent technologies actually are. And I can see how much people close to tech are enjoying this shift. Tools that used to be the exclusive domain of developers are going mainstream. Designers, marketers, and specialists from entirely non-technical fields are showing up on GitHub, writing agent skills and launching their own pet projects.

In 2025, [121 million new repositories](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/) were created on GitHub — a record in the platform's history.

 <img loading="lazy" src="/images/octoverse-genai-projects.webp" alt="GitHub Octoverse: repository growth on GitHub">

{{< caption >}}Number of repositories on GitHub{{< /caption >}} 

One more thing worth emphasizing: Markdown is a format that every LLM understands without ambiguity — unlike .docx, .pdf, and other document formats. And it's not just headings and lists; here's the full [specification](https://spec.commonmark.org/0.31.2/#introduction). Markdown will outlive any tool. Evernote is dying, Notion will shut down someday, Google Docs is tied to your account — but an .md file will open in any text editor 20 years from now. It's plain text.

**Granola** is a service for recording, transcribing, and generating meeting notes. It works on both smartphone and desktop, and handles in-person and online meetings alike. It handles Russian language input very well. Amusingly, [Granola](https://www.granola.ai/) outputs md-files (naturally), and one Obsidian enthusiast wrote a [Granola-to-Obsidian](https://github.com/dannymcc/Granola-to-Obsidian) plugin that syncs notes directly into your Obsidian workspace.

This raises an important question about information security, especially for work use. Transcription in Granola happens locally on your device — the audio never leaves it. However, for generating notes, Granola by default sends the transcript to ChatGPT. For that step, I use my company's internal LLM instead.

**Claude Code** is an agentic AI with access to the file system — in our case, the Obsidian vault folder. It can read, edit, create, and analyze any files in that space. Despite the name, it's not just for writing code — it handles analysis and work on any kind of text document extremely well. One interesting quirk: you interact with Claude Code through the terminal. But trust me, it's intuitive enough that it doesn't cause any real friction.

<img loading="lazy" src="/images/obsidian-claude-scr.png" alt="Obsidian and Claude Code CLI">

{{< caption >}}Obsidian and Claude Code CLI{{< /caption >}} 

[Claude](https://claude.ai/) has other interfaces too: web, desktop, mobile app, and extensions for Chrome, Excel, and PowerPoint. They each serve their purpose, but none of them have direct access to files in the Obsidian vault — which is why Claude Code is the key tool in our smart stack.

What tasks to delegate to Claude is a personal decision. My rule is simple: I only delegate what I can verify. Either I understand how something should be done and Claude saves me time, or I know exactly what output I want and can evaluate the result.

As a side note, I'm writing this article together with Claude — he flags where the text sounds awkward or ambiguous, fixes typos, processes images and tweaks CSS styles, and helps with diagrams. Claude helped me migrate all the posts from my old WordPress blog to a new one built on [Hugo](https://gohugo.io/) in a single evening — something I'd been putting off for ages, because before LLMs could write code, it felt like a heavy lift.

Worth noting: the files Claude Code accesses are sent to external servers. But there are solutions for sensitive data: an [enterprise version](https://claude.com/product/claude-code/enterprise) where data stays within your own infrastructure and is legally protected, or even running it locally with open-source models via [Ollama](https://ollama.com/).

Let's return to the analogy between our stack and the structure of the human brain:

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

{{< caption >}}The stack mapped onto brain structure{{< /caption >}} 

Each tool in the stack plays a distinct role: Granola captures the incoming stream (auditory cortex), PARA routes information (hippocampus), Obsidian stores knowledge (memory), and Claude Code analyzes and supports decision-making (prefrontal cortex).

I arrived at this stack after a long series of experiments and a losing battle with the chaos of scattered document storage — spread across a local drive, cloud services, Telegram saved messages, and various to-do apps. So far, it's holding steady.