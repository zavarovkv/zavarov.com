+++
source_hash = "417fb25a9c52"
title = "ICE, RICE, DRICE Prioritization Frameworks"
slug = "drice"
date = "2024-10-24T15:17:01+03:00"
description = "A detailed breakdown of the ICE, RICE, and DRICE task prioritization frameworks: formulas, examples, and a comparison of approaches."
categories = ["strategy"]
telegram_post = 57
math = true
+++

Ein, zwei, drei… There are endless ways to prioritize tasks. Every product I've ever worked on had its own unique ranking method, each with its own quirks. For a quick tour of all the approaches used at major companies, check out [Misha Karpov's talk](https://www.youtube.com/watch?v=BpXVJByOh8g&t=2421s) at Yandex's product meetup [1]. As for me, my personal favorite prioritization methods are the energy-based one — where priorities are chosen based on how you're feeling that day — and the intuitive one, where you simply follow your gut and your heart. Too bad the team rarely agrees to go along with either.

But seriously, the goal of this post is to introduce Detailed RICE (DRICE) — though first, a quick overview of ICE and RICE. Repetition is the mother of learning.

In 2017, [Sean Ellis](https://www.seanellis.me/blog.html) — the man who coined the terms "growth hacking" and "North Star metric," familiar to every product manager — invented a simple method for prioritizing growth hypotheses: ICE (Impact, Confidence, Ease). The framework was first described in the book [*Growth Hacking*](https://www.litres.ru/book/morgan-braun/vzryvnoy-rost-kak-sovremennye-bystrorastuschie-kompanii-sover-25017015/). Product managers later adopted it for prioritizing product initiatives (I like the meta-term "initiative" because it encompasses projects, hypotheses, tasks, and problems alike — though the specifics don't matter much in this context).

In the ICE framework [2], Impact (effect on the target metric), Confidence (certainty in that impact estimate), and Ease (ease of implementation) are each rated on a scale from 0 to 10. The overall score is calculated as the product of all three variables: $$\text{ICE Score} = I \times C \times E$$

The higher the score, the higher the priority of the initiative.

ICE is easy to use, but it can feel overly subjective since all parameters are normalized on the same 0–10 scale. For that reason, both in practice and in the product community, more attention tends to go to RICE, which is slightly more complex but more precise. I've never actually seen ICE used on a real product — I'd suggest treating it as a learning exercise rather than a practical tool.

The RICE prioritization framework (Reach, Impact, Confidence, Effort) was developed internally at Intercom, a company well known for its product culture. It was first published on their company blog in the article ["RICE: Simple prioritization for product managers"](https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/). The acronym looks similar to the previous one, but the parameters are calculated quite differently.

1. **Reach** — the number of unique users the initiative will affect within a month.

2. **Impact** — a subjective assessment of the initiative's effect on the target metric, rated on a scale from 0.25 (minimal impact) to 3 (very strong impact).

3. **Confidence** — overall confidence in the estimates of the other parameters: Reach, Impact, and Effort. Rated from 20% (essentially a lottery) to 100% (high confidence backed by research data).

4. **Effort** — estimated work in person-months; unlike the other parameters, this is filled in by a technical specialist, not the product manager.

The overall score is calculated as:

$$\text{RICE Score} = \frac{R \times I \times C}{E}$$

The higher the score, the higher the priority of the initiative.

RICE is more versatile and sees wider use in product work — either as originally described or with modifications where needed. The main challenge with RICE is that Impact and Confidence can be genuinely difficult to estimate. Product managers often end up falling back on intuition — but as I mentioned at the start, that approach doesn't go over well with product teams, and it does hurt accuracy.

In late 2023, [Darius Contractor](https://www.linkedin.com/in/dariusmc/) (ex-Head of Growth at Dropbox, Facebook, and Airtable) and Alexey Komissarouk decided to put RICE on steroids for greater precision — and came up with Detailed RICE, or DRICE. As the name suggests, it achieves more accurate estimates by having the product team work through additional context for each initiative. The process starts with all ideas being ranked by RICE, and then each one is worked through by the product team in a 30-minute session.