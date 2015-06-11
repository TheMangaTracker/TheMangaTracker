#!/usr/bin/env python
# -*- coding: utf-8 -*-

from builder import Builder

b = Builder('test_build',
    name="The Manga Tracker",
    version="0.0.0.0",
    description="Read all your manga in one place and track your progress and updates too!",
    icons=[
        (128, "icons/128.png"),
    ])

b.clean()
b.render("**/*.html")
b.render("**/*.json")
b.render("**/*.js")
b.copy("**/*.png")
