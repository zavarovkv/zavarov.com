+++
title = "A/B Test Design Template"
slug = "template-abt"
date = "2022-08-22T12:00:00+03:00"
description = "A Google Sheets template for designing A/B tests: hypothesis formulation, sample size calculation, and experiment duration."
categories = ["metrics"]
+++

A Google Sheets template for designing A/B tests. It helps you structure an experiment before launch — from hypothesis formulation to test duration calculation.

<a class="button" target="_blank" href="https://docs.google.com/spreadsheets/d/1zZbdA6IfF65Vg-puwzFS8QMacBDei5nz2Hs3N8kXq_w/edit?usp=sharing">Download template</a>

<img loading="lazy" src="/images/template-abt.webp" alt="A/B Test Design Template">

## What's inside

**Experiment description** — a hypothesis statement in the format: "If [product change], then [target metric] will change by [expected result], because [research data]." This section also captures the target metric and experiment start date.

**Baseline values** — parameters used for calculation:
- Number of monthly visitors and submissions
- Traffic share per variant (50% by default)
- Baseline Rate
- Confidence Level (1−α) — 95% by default
- Statistical Power (1−β) — 80% by default

**Duration calculation** — the spreadsheet automatically calculates values for different MDE levels ranging from 5% to 30%. MDE (Minimum Detectable Effect) is the smallest effect size the experiment is able to detect. For example, an MDE of 10% at a baseline conversion rate of 10% means the test will detect a shift in conversion to 11% (an absolute lift of 1%), but will miss smaller changes. The spreadsheet calculates:

- Lift in Conversion
- Target Value
- Required Sample Size
- Duration in days and weeks
- Experiment end date

The smaller the effect you want to detect, the longer the test needs to run. For example, with a baseline conversion rate of 10% and 10,000 monthly visitors: detecting a 5% MDE would take ~692 days, while a 20% MDE would take just ~46 days.