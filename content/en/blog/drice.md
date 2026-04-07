+++
title = "Prioritization Methods: ICE, RICE, DRICE"
slug = "drice"
date = "2024-10-24T15:17:01+03:00"
description = "A detailed breakdown of ICE, RICE, and DRICE prioritization methods: formulas, examples, and a comparison of approaches."
categories = ["strategy"]
telegram_post = 57
math = true
+++

Eins, zwei, drei… There are endless ways to prioritize tasks. Every product I've ever worked on had its own original approach to ranking projects — each with its own quirks. For a quick tour of the methods used at major companies, check out [Misha Karpov's talk](https://www.youtube.com/watch?v=BpXVJByOh8g&t=2421s) at a Yandex product meetup [1]. As for my personal favorites — there's the energy-based method, where priorities shift depending on how you're feeling, and the intuitive method, where you just listen to your gut. The only problem is that teams rarely agree to go along with either approach.

But in all seriousness, the goal of this post is to introduce Detailed RICE (DRICE) — though first, a quick overview of ICE and RICE. Repetition is the mother of learning.

In 2017, [Sean Ellis](https://www.seanellis.me/blog.html) — the man who coined "growth hacking" and "North Star metric," concepts every product manager knows by heart — invented a simple method for prioritizing growth hypotheses: ICE (Impact, Confidence, Easy). The method was first described in the book [*Growth Hacking*](https://www.litres.ru/book/morgan-braun/vzryvnoy-rost-kak-sovremennye-bystrorastuschie-kompanii-sover-25017015/). Product managers later adopted it for prioritizing product initiatives (I'm fond of the meta-term "initiative" because it covers projects, hypotheses, tasks, and problems alike — though the specifics don't matter much in this context).

In the ICE method [2], all three parameters — Impact (effect on the target metric), Confidence (confidence in that impact estimate), and Easy (ease of implementation) — are scored on a scale from 0 to 10. The overall score is calculated as the product of all three: $$\text{ICE Score} = I \times C \times E$$

The higher the score, the higher the priority of the initiative.

ICE is simple to use, but it can feel overly subjective since all parameters are normalized to the same 0–10 scale. That's why RICE tends to get more attention in real-world projects and the product community — it's slightly more complex, but more precise. I've never actually seen ICE used on a live product; I'd treat it as more of a learning exercise.

The RICE prioritization method (Reach, Impact, Confidence, Effort) was developed internally at Intercom, a company well known for its product culture. It was first published on their blog in the article [«RICE: Simple prioritization for product managers»](https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/). The acronym looks similar to ICE, but the parameters are calculated differently.

1. **Reach** — the number of unique users the initiative will affect per month.

2. **Impact** — a subjective assessment of how the initiative affects the target metric, scored on a range from 0.25 (minimal impact) to 3 (very strong impact).

3. **Confidence** — overall confidence in the estimates of the other parameters: Reach, Impact, and Effort. Ranges from 20% (a lottery) to 100% (high confidence backed by research data).

4. **Effort** — estimated effort in person-months. Unlike the other parameters, this one is filled in by a technical specialist, not the product manager.

The overall score is calculated as:

$$\text{RICE Score} = \frac{R \times I \times C}{E}$$

The higher the score, the higher the priority of the initiative.

RICE is more versatile and more commonly used in product work — either in its original form or with modifications as needed. The main challenge with RICE is that estimating Impact and Confidence is genuinely hard. Product managers end up relying on intuition — but as I mentioned at the start, that doesn't sit well with most product teams, and it does hurt accuracy.

In late 2023, [Darius Contractor](https://www.linkedin.com/in/dariusmc/) (ex-Head of Growth at Dropbox, Facebook, and Airtable) and Alexey Komissarouk decided to put RICE on steroids for greater precision — and came up with Detailed RICE (DRICE). As the name suggests, it aims for more accurate scoring by having the product team work through additional context together. The process starts with ranking all ideas using RICE, then spending 30 minutes with the product team going deeper on each one.