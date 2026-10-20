+++
title = "Название вебинара"
description = "Кому полезен вебинар и что на нем обсудим."
type = "event"
layout = "landing"
event_label = "Вебинар"
share_title = "Название\nвебинара"
hidden = true
draft = true
outputs = ["HTML"]

intro = "Короткое описание пользы. Два взгляда на одну тему."
format = "Онлайн"
format_note = "Диалог и вопросы"
audience = "Кому стоит прийти."
questions_note = "В конце оставим время на вопросы."

# Review the date before publishing. Times use Moscow's +03:00 offset.
event_start = "__EVENT_DAY__T19:00:00+03:00"
event_end = "__EVENT_DAY__T20:30:00+03:00"

# The form stays hidden until both registration settings are filled.
registration_action = ""
registration_telegram_field = ""
registration_label = "Зарегистрироваться"
registration_note = "Ссылку на эфир пришлем лично в Telegram."

# Place images beside this file and enter their filenames below.
# cover_image = "cover.png"

[build]
  publishResources = false

[[takeaways]]
  title = "Первая тема"
  text = "Какую задачу участника разберем."

[[takeaways]]
  title = "Вторая тема"
  text = "Что обсудят ведущие и с чем уйдет участник."

[[speakers]]
  name = "Имя ведущего"
  role = "Роль и компания"
  bio = "Почему ему есть что рассказать по теме."
  # image = "speaker.jpg"
  # telegram = "username"
  # telegram_channels = ["channel"]

[[speakers]]
  name = "Имя второго ведущего"
  role = "Роль и компания"
  bio = "Какую точку зрения он добавит в разговор."
+++
