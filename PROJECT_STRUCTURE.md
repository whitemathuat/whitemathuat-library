# PROJECT_STRUCTURE.md

# White Ma Thuat Library - Project Structure

## Purpose

This project generates and displays an EPUB-style web library.

The application is primarily a static site generator written in Python.

Python generates HTML pages from templates, metadata, and configuration files.

The generated pages are then displayed as a responsive website.

---

# Overall Architecture

Python
↓

Read metadata

↓

Generate HTML

↓

Apply CSS

↓

Final static website

---

# Important Files

## build_detail.py

Purpose

Generate the detail page for each novel.

Responsibilities

* Read novel metadata.
* Generate detail HTML.
* Render notes.
* Render highlights.
* Build the final detail page.

When to modify

* Detail page layout logic
* Note rendering
* Highlight rendering
* HTML generation

Avoid modifying this file for purely visual changes.

---

## build_index.py

Purpose

Generate index pages.

Responsibilities

* Homepage
* Category pages
* Novel lists
* Navigation

Modify only when changing how library pages are generated.

---

## detail.css

Purpose

Main stylesheet for novel detail pages.

Contains

* Sidebar
* Reading layout
* Note bubbles
* Highlight colors
* Typography
* Responsive layout

UI changes should normally be implemented here first.

Prefer CSS over Python whenever possible.

---

## note.json

Purpose

Stores note-related configuration and metadata.

Python reads this file when generating notes.

Do not modify unless note data structure changes.

---

## Templates

Purpose

Reusable HTML templates.

Python injects data into these templates.

Prefer modifying templates instead of generated HTML.

---

## Assets

Contains

* Images
* Icons
* Static resources

Should not contain business logic.

---

# Preferred Modification Strategy

## UI Request

Preferred order

1. CSS
2. Template
3. Python

Avoid changing Python unless CSS or templates cannot solve the problem.

---

## New Feature

Preferred order

1. Understand existing architecture.
2. Reuse existing code.
3. Extend current implementation.
4. Avoid rewriting working code.

---

## Bug Fix

Before fixing

* Identify the root cause.
* Explain the cause.
* List affected files.

Only modify files related to the bug.

---

# Project Philosophy

Keep the project modular.

Avoid large refactors.

Keep existing architecture.

Preserve backward compatibility.

Do not introduce unnecessary abstractions.

---

# AI Working Rules

Before editing

1. Read all relevant files.
2. Search the project for related implementations.
3. Explain which files will be modified.
4. Explain why those files are necessary.

For every response

* Prefer small focused changes.
* Avoid touching unrelated files.
* Preserve existing naming conventions.
* Preserve project style.

---

# UI Design Rules

When a design image is provided

* Treat the image as the source of truth.
* Match layout as closely as possible.
* Preserve existing functionality.
* Modify CSS first.
* Modify HTML only if necessary.
* Modify Python only if HTML generation must change.

---

# Communication

Assume the project owner is not a professional programmer.

When explaining code

* Explain the purpose first.
* Use simple language.
* Avoid unnecessary jargon.
* Clearly indicate which files are affected.

---

# Approval Rule

For any task that changes more than one file

Always provide

* Files to be modified
* Reason for each modification
* Expected impact

Wait for approval before making large changes.
