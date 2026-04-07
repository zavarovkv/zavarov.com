+++
title = "Prioritization Methods: ICE, RICE, DRICE"
slug = "drice"
date = "2024-10-24T15:17:01+03:00"
description = "A detailed breakdown of the ICE, RICE, and DRICE task prioritization methods: formulas, examples, and a comparison of approaches."
categories = ["Стратегия и фреймворки"]
telegram_post = 57
math = true
+++

Ein, zwei, drei… There are endless ways to prioritize tasks. Every product I've ever worked on had its own original ranking method, each with its own quirks. For a quick tour of the approaches used at large companies, check out [Misha Karpov's talk](https://www.youtube.com/watch?v=BpXVJByOh8g&t=2421s) at a Yandex product meetup [1]. As for my personal favorites — there's the energy method, where priorities are chosen based on how you're feeling, and the intuitive method, where you simply listen to your gut. The only problem is that teams rarely agree to follow either approach.

But in all seriousness, the goal of this article is to introduce Detailed RICE (DRICE) — with a quick overview of ICE and RICE first, as a refresher. Repetition is the mother of learning.

In 2017, [Sean Ellis](https://www.seanellis.me/blog.html) — the person who coined the terms "Growth Hacking" and "North Star Metric," both well known to every product manager — invented a simple method for prioritizing growth hypotheses: ICE (Impact, Confidence, Easy). The method was first published in the book [*Growth Hacking*](https://www.litres.ru/book/morgan-braun/vzryvnoy-rost-kak-sovremennye-bystrorastuschie-kompanii-sover-25017015/). Product managers later adopted it for prioritizing product initiatives (I like the meta-term "initiative" because it covers projects, hypotheses, tasks, and problems alike — though the specifics don't matter much in this context).

In the ICE method [2], Impact (effect on the target metric), Confidence (certainty about the impact estimate), and Easy (ease of implementation) are all scored on a scale from 0 to 10. The overall score is calculated as the product of all three variables: $$\text{ICE Score} = I \times C \times E$$

The higher the score, the higher the priority of the initiative.

ICE is simple to apply, but feels overly subjective because all parameters are normalized on the same 0–10 scale. As a result, RICE tends to get more attention in real projects and in the product community — it's a bit more complex, but more precise. I've never seen ICE used on an actual product, so I'd treat it as more of a teaching tool.

The RICE prioritization method (Reach, Impact, Confidence, Effort) was developed internally at Intercom, a company well known for its product culture. It was first described in a company blog post titled [«RICE: Simple prioritization for product managers»](https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/). The acronym looks similar to ICE, but the parameters are calculated differently.

1. **Reach** — the number of unique users the initiative will affect within a month.

2. **Impact** — a subjective assessment of the initiative's effect on the target metric, rated on a scale from 0.25 (minimal impact) to 3 (very strong impact).

3. **Confidence** — overall confidence in the estimates of the other parameters: Reach, Impact, and Effort. Rated from 20% (essentially a lottery) to 100% (high confidence backed by research data).

4. **Effort** — estimated effort in person-months. Unlike the other parameters, this one is filled in by a technical specialist, not the product manager.

The overall score is calculated as:

$$\text{RICE Score} = \frac{R \times I \times C}{E}$$

The higher the score, the higher the priority of the initiative.

RICE is more versatile and is more commonly used in product work — either as originally described, or with modifications when needed. The main challenge with RICE is that Impact and Confidence can be quite difficult to estimate. Product managers often have to fall back on intuition — but as I mentioned at the start of this article, that approach doesn't tend to sit well with product teams, and it hurts the accuracy of the estimates.

In late 2023, [Darius Contractor](https://www.linkedin.com/in/dariusmc/) (ex-Head of Growth at Dropbox, Facebook, and Airtable) and Alexey Komissarouk decided to put RICE on steroids for greater precision — and came up with Detailed RICE (DRICE). As the name implies, it's used for more accurate scoring by having the product team work through additional context. The process starts with ranking all ideas using RICE, then spending 30 minutes with the product team digging deeper into each one.