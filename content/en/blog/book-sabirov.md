+++
title = "“Игра в цифры. Как аналитика позволяет видеоиграм жить лучше”, Vasily Sabirov"
slug = "sabirov"
description = "Reading notes on “Игра в цифры. Как аналитика позволяет видеоиграм жить лучше” by Vasily Sabirov."
date = "2023-08-01T00:00:00+03:00"
url = "books/sabirov/"
hidden = true
categories = [ "collections" ]
archive_url = "https://web.archive.org/web/20240223002727id_/https://zavarov.com/books/sabirov/"
math = true
date_precision = "month"
lastmod = "2026-10-25T00:00:00+03:00"
source_hash = "72dac8e6743f99ef834d6fb1f0f365a96033c12274e287d4b365fc44132bf2b1"
+++

This is a book about game analytics, so everything it describes applies primarily to games.

## Metrics for assessing a game's early performance

Metrics for the period immediately after a game's release, during a soft launch, or following an update.

### First-day metrics

- 1-Day Retention
- 0-Day Retention (a reference range of 60–70%)
- Tutorial completion rate (COR; a reference range of 70–80%)
- Tutorial Skip Rate
- Time taken to complete the tutorial
- Share of players who reach level N

### First-week metrics

- CARPU N day: cumulative ARPU over N days, also called RPI (Revenue Per Install). “Suppose you acquire users on February 1. Record that date and measure how much money those players generate on their first day, over their first two days, or over their first week in the game, divided by the total number of players who registered on February 1.”
- Conversion to the first payment within a seven-day window
- 7-Day Retention

## The 40–20–10 rule

Reasonably good retention is 40% on day 1, 20% on day 7 and 10% on day 28.

> “Day-1 retention reflects a user's first impression of the project, their response to the interface, the application's usability and how well it meets their expectations and needs. Day-1 retention also affects retention on subsequent days, so this metric deserves particular attention.”

## A map of metrics

Revenue is the main target metric. The metrics map describes the user's journey from downloading the game to making a payment.

## North Star Metric (NSM)

The NSM is the metric that best reflects the product's core value to users.

Properties of an NSM:

- Revenue connection: it should either measure money or have a causal relationship with it.
- Value to users: it should reflect the happiness the product delivers.
- Measurability: it should be straightforward to measure.

## Return on investment

Two ways to calculate ROI:

$$
\mathrm{ROI} = \frac{\mathrm{Revenue} - \mathrm{Investments}}{\mathrm{Investments}}
$$

$$
\mathrm{ROI} = \frac{\mathrm{Revenue}}{\mathrm{Investments}} \times 100\%
$$

In the first case, the investment has paid off when ROI > 0. In the second, when ROI > 100%.

To monitor how quickly an investment pays back, ROI is calculated over time: on days 7, 14, 30, 60, 90 and beyond. Calculating ROI at specific points makes it possible to compare projects even when their investments were made at different times.

## The aha! moment

The moment when a user takes an action in the product that is likely to make them stay.

## The user's intended journey

Installation → activation → return → payment

## Types of retention

1. **Classic Retention**
2. **Rolling Retention**: day-N rolling retention shows the share of users who return on day N after installation **or later**.
3. **Full Retention**: day-N full retention shows the share of users who open the application **every day through day N**.
4. **Return Retention**: day-N return retention shows the share of users who return **at least once within N days**.
5. **Bracket-Dependent Return Retention**: like return retention, but measured within a particular interval.

## Lifetime

Lifetime shows how long it takes for a user to leave a project.

It can be calculated as the integral of the retention function, or the area under the retention curve. Calculating lifetime for each of two cohorts helps determine whether a product change is an improvement. The retention curve alone does not always make this clear.

Increasing lifetime increases lifetime value and, consequently, revenue.

## Metrics for assessing traffic quality

- ARPU (Average Revenue Per User)
- RPI (Revenue Per Install)
- CPI (Cost Per Install)
- Paying Share
- Retention
- Return on investment (ROI)

## Active users

- Users Online / Concurrent Users (CCU): active users currently in the application.
- Peak Concurrent Users: the largest number of users in the application at the same time, an important metric for server capacity planning.
- New Users → Active Users → Paying Users

## Sticky factor

$$
\text{Sticky Factor} = \frac{\mathrm{DAU}}{\mathrm{MAU}} \times 100\%
$$

## Paying users

$$
\text{Paying Share} = \frac{\text{Paying Users}}{\text{Active Users}}
$$

$$
\mathrm{Revenue} = \mathrm{ARPPU} \times \text{Paying Users}
$$

Paying share depends on the type of application but is often quite small, around 1–2%. The median share of paying users in mobile free-to-play games is considered to be 1%: most of the audience prefers not to pay.

## Ways to segment paying users

### By total payments (% indicates quantiles)

- Grand Whales: 1%
- Whales: 2–10%
- Grand Dolphins: 11–25%
- Dolphins: 25–50%
- Minnows: 50–100%

### By number of payments

At a minimum, distinguish users who have paid once from those who have paid repeatedly. The latter bring in a steady income.

Users can also be segmented by the time elapsed since installation.

## RFM analysis

- Recency: the time between the current date and a user's last payment.
- Frequency: the number of transactions a user made during the period studied.
- Monetary: the total value of their purchases over that period.

## ARPU / ARPDAU / ARPMAU

ARPU is one of the main measures of monetization effectiveness and directly affects revenue.

$$
\mathrm{ARPU} = \frac{\mathrm{Revenue}}{\text{Active Users}}
$$

$$
\mathrm{Revenue} = \mathrm{ARPU} \times \text{Active Users}
$$

## ARPPU

$$
\mathrm{ARPPU} = \frac{\mathrm{Revenue}}{\text{Paying Users}}
$$

$$
\mathrm{Revenue} = \mathrm{ARPPU} \times \text{Paying Users}
$$

## CARPU

$$
\mathrm{CARPU}(\text{day }N) = \frac{\mathrm{Revenue}(\text{day }N)}{\text{Users In Cohort}}
$$

The CARPU level at which the metric stops increasing can be considered **Lifetime Value (LTV)**: the average revenue from one user over their entire time in the project.

Knowing a project's cumulative ARPU tells us how much money a user will bring in by day 7, day 30, or even after three months. In other words, **we can estimate how much a new user will generate and when.**

## LTV

- Lifetime value calculated across the entire user base is not very useful: an abstract idealization with little practical application.
- A user should generate more revenue than was spent on acquiring them. The following condition must hold: \(\mathrm{LTV} > \mathrm{CAC}\)
- It is better to calculate LTV separately by acquisition channel, campaign and country.
