+++
title = "Calculating Classic, Rolling, and Full Retention in Python"
slug = "retention"
date = "2023-08-16T12:00:00+03:00"
description = "A walkthrough of how to manually calculate 3 types of Retention metrics using Python and Pandas, and how to plot a Retention curve using Matplotlib."
categories = ["Метрики и аналитика"]
telegram_post = 37
+++

In this post, I want to walk through how to manually calculate 3 types of Retention metrics using Python and Pandas, and how to plot a Retention curve using Matplotlib. Most of the time, a product manager will use an analytics platform to analyze data and metrics — but let's imagine our PM is stranded on a desert island with nothing but a Python interpreter and a few extra libraries. That's exactly what we'll use.

First, a quick refresher on the metric and its types.

***Classic Retention Rate*** is a metric that shows the percentage of users who returned to the product on a specific day *N* (week *N*, month *N*, quarter *N*, etc.) since their first visit. For example, if *100* new users came on day *0* and *15* of them came back on day *1*, then Day 1 Retention is *15 / 100 = 15%*.

***Rolling Retention Rate*** shows the percentage of users who returned to the product on day *N* **or later** since their first visit. For example, two users visited the product for the first time on the same day (day *0*). One of them returned on day *1*, the other on day *5*. Both will be counted as having returned by day *1*.

***Full Retention Rate*** shows the percentage of users who visited the app **every day up to day N** since their first visit. For example, *Full Retention Rate for day 3* is the percentage of users who visited the product on days 1, 2, and 3 since their first visit.

Retention can be calculated across different window sizes: daily, weekly, monthly, or quarterly. In this post, we'll work with daily Retention.

GoPractice has excellent in-depth articles on Retention metrics and even benchmark values: [[one]](https://gopractice.ru/product/retention/), [[two]](https://gopractice.ru/product/nday-retention-rollling-retention/), and [[three]](https://gopractice.ru/product/lenny_rachitsky_what_is_good_retention/). I'll focus here on how to calculate these metrics by hand.

## The Dataset

For our calculations, we'll use a synthetic dataset with two fields (columns): *«user_id»* — the unique user ID; *«date»* — the date of the product visit. You can find the original dataset [here](/data/retention-dataset.csv). Here are the first 10 rows:

| user_id | date |
|---|---|
| e554f976-36eb-4d07-be19-144ff7f1b416 | 2020-01-05 |
| 4e849e4a-6bc9-45ac-8398-5cea217430de | 2020-01-06 |
| 86a4be3a-e13c-4e7d-a017-34799c866425 | 2020-01-06 |
| 6c3f44bb-441d-4640-899a-f96e1918064b | 2020-01-02 |
| 0f4bd366-8433-4ea9-b7e3-5e507fcfaa02 | 2020-01-23 |
| 0a0bb591-4e64-4751-9c58-898d0ebf9d95 | 2020-01-18 |
| d75a6f2a-145e-4183-bb8a-e2d95c93c154 | 2020-01-29 |
| 67889f56-a58e-4122-b015-42dccc5a2ec2 | 2020-01-01 |
| 5da0336e-2cce-48c8-94e9-c0968433d930 | 2020-01-02 |
| b8df8afb-23ed-4a0f-bb1d-4b5f5a2a94fd | 2020-01-25 |

Let's import the necessary libraries and load the data into a Pandas DataFrame.

```python
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick

# Path to the data file
dataset_path = 'https://data/retention-dataset.csv'

# Read data and parse dates
df = pd.read_csv(dataset_path, parse_dates=['date'])
```

## Calculating Classic Retention

Now let's write a function called *calculate_classic_retention* that takes a DataFrame and calculates Classic Retention for the days we need. We'll pass the DataFrame and a list of target days as inputs.

For the calculations, we'll need to create two additional columns in the DataFrame: *start_date* — the date of the user's first visit; *day* — the number of days between the first visit and the current visit.

To calculate *Retention for day N*, we simply count the number of rows in the *day* column (with unique *user_id* values) and divide by the total number of users in the cohort.

```python
def calculate_classic_retention(df: pd.DataFrame, days: list) -> list:

    # Calculate the start date for each user and merge with the original DataFrame
    start_date = df.groupby('user_id')['date'].min().rename('start_date')
    df = pd.merge(df, start_date, left_on='user_id', right_index=True)

    # Calculate the number of days from the start date for each row
    df['day'] = (df['date'] - df['start_date']).dt.days

    # Create a list to store classic retention for each day
    classic_retention = []

    # Calculate classic retention for each day
    for day in days:
        # Select users who returned on day `day`
        users_with_classic_day = df[(df['day'] == day)]['user_id'].unique()

        # Calculate classic retention for day `day`
        classic_retention.append(len(users_with_classic_day) / len(df['user_id'].unique()))

    return classic_retention
```

To visualize the Retention curve, I wrote a *plt_show* function that takes *days* — a list of day numbers; *retention* — a list of calculated Retention values for those days; *xs* — a list of day indices to highlight on the chart.

```python
def plt_show(days: list, retention: list, xs: list, title: str):
    plt.figure(figsize=(12, 4))
    plt.plot(days, retention)
    plt.title(title)
    plt.gca().yaxis.set_major_formatter(mtick.PercentFormatter(xmax=1.0))
    plt.gca().set(xlabel='Days', ylabel='% Retaining Users')
    plt.ylim(0, 1.05)
    for x in xs:
        plt.vlines(x=days[x], ymin=0, ymax=retention[x], linestyles='dotted')
        plt.text(x=days[x], y=retention[x] + 0.05, s='{:.0%} (day {})'.format(retention[x], x))
    plt.show()
```

Let's calculate Classic Retention, plot the curve, and mark the values for days *1, 7, 28, and 56*. We'll see that our synthetic dataset produces synthetically wonderful metric values — well above the "40 — 20 — 10" rule of thumb.

```python
days = list(range(0, 63))

classic_retention = calculate_classic_retention(df, days)

plt_show(days, classic_retention, xs=[1, 7, 28, 56], title='Daily Classic Retention')
```

![Classic Retention](/images/retention-classic.png)

We can see that 70% of users returned the day after their first visit, 36% came back on day 7, and 20% on day 28. After roughly 30 days, the curve flattens out — indicating that the product has found Product/Market Fit.

## Calculating Rolling Retention

Now let's write the *calculate_rolling_retention* function. Its logic is almost identical to the previous one, with one key difference — we now select records where the day number is greater than or equal to the day we're calculating the metric for.

Here's that condition:

```python
df[df['day'] >= day]['user_id'].unique()
```

And here's the full function:

```python
def calculate_rolling_retention(df: pd.DataFrame, days: list) -> list:

    # Calculate the start date for each user and merge with the original DataFrame
    start_date = df.groupby('user_id')['date'].min().rename("start_date")
    df = pd.merge(df, start_date, left_on='user_id', right_index=True)

    # Calculate the number of days from the start date for each row
    df['day'] = (df['date'] - df['start_date']).dt.days

    # Create a list to store rolling retention for each day
    rolling_retention = []

    # Calculate rolling retention for each day
    for day in days:
        # Select users who returned on day `day` or later
        users_with_rolling_day = df[df['day'] >= day]['user_id'].unique()

        # Calculate rolling retention for this day
        rolling_retention.append(len(users_with_rolling_day) / len(df['user_id'].unique()))

    return rolling_retention
```

And the results:

```python
days = list(range(0, 63))

rolling_retention = calculate_rolling_retention(df, days)

plt_show(days, rolling_retention, xs=[1, 7, 28, 56], title='Daily Rolling Retention')
```

![Rolling Retention](/images/retention-rolling.png)

We can see that 93% of users returned to the product starting from the day after their first visit, 69% from day 7 onward, and 46% from day 28 onward.

## Calculating Full Retention

Finally, let's write the function for calculating Full Retention.

```python
def calculate_full_retention(df: pd.DataFrame, days: list) -> list:

    # Calculate the start date for each user and merge with the original DataFrame
    start_date = df.groupby('user_id')['date'].min().rename("start_date")
    df = pd.merge(df, start_date, left_on='user_id', right_index=True)

    # Calculate the number of days from the start date for each row
    df['day'] = (df['date'] - df['start_date']).dt.days

    # Create a list to store full retention for each day
    full_retention = []

    for day in days:
        # Create the set of days we expect to see for full retention
        expected_days = set(range(1, day + 1))

        # Get unique activity days for each user
        unique_days = df.groupby('user_id')['day'].unique()

        # Identify users with full retention up to retention_day
        full_retention_users = unique_days[unique_days.apply(lambda x: set(x) > expected_days)].index

        # Calculate full retention for this day
        full_retention.append(len(full_retention_users) / len(df['user_id'].unique()))

    return full_retention
```

```python
days = list(range(0, 10))

full_retention = calculate_full_retention(df, days)

plt_show(days, full_retention, xs=[1, 3, 6], title='Daily Full Retention')
```

![Full Retention](/images/retention-full.png)

We can see that 70% of users returned to the product the day after their first visit. Since this matches the Classic Retention value, I probably didn't make a mistake in the calculations :). 22% of users visited the product every day for 3 consecutive days, and only 2% visited it every day for 6 consecutive days.

## Takeaways

- Source code is available in [[Google Colab]](https://colab.research.google.com/drive/1jIwW-itIFvCIpIhH6ANaQx5RwtzYDjfL?usp=sharing) and on [[GitHub]](https://github.com/zavarovkv/python-notebooks/blob/main/calculate_retention_rate.ipynb), first of all.
- There are no universal parameters for calculating Retention that work for every product. The right metric type, window size, and benchmark values all depend on the nature of the product and its current goals.
- That said, Classic Retention is a more widely used metric than Rolling or Full Retention.
- Calculating these metrics by hand is fairly straightforward, but it does take some practice with product analytics tooling.