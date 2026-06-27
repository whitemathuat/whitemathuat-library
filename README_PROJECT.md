# White Ma Thuat Library

## Project Overview

This project generates and displays an EPUB-style web library.

The codebase contains:

- Python scripts that generate HTML pages.
- HTML templates.
- CSS files for UI and styling.
- JSON configuration files.
- Assets such as images and icons.

The project is intended to be maintainable, modular, and easy to extend.

---

# Project Rules

Before answering any question:

1. Read the relevant files before making assumptions.
2. Search the codebase for related files if necessary.
3. Explain your reasoning before making major code changes.
4. Keep existing project architecture whenever possible.
5. Avoid unnecessary refactoring.

---

# Modification Rules

Only modify files that are necessary.

Examples:

- UI request → Prefer CSS first.
- HTML structure → Modify HTML only if CSS is insufficient.
- Python logic → Modify Python only when required.

Do NOT rewrite unrelated files.

---

# Coding Style

Prefer:

- Small, focused changes.
- Clear variable names.
- Maintain existing code style.
- Keep comments concise.
- Preserve backward compatibility.

---

# When Working on UI

Unless explicitly requested:

- Do not redesign the whole page.
- Preserve the existing layout.
- Match the provided design as closely as possible.
- Reuse existing CSS classes when possible.

---

# When Working on Python

Before modifying Python:

1. Understand how the current implementation works.
2. Explain what will change.
3. Modify only the required functions.
4. Avoid changing unrelated behavior.

---

# Before Editing

Always tell me:

- Which files will be modified.
- Why those files are needed.
- Whether the change affects other modules.

Wait for my approval before making large changes.

---

# Images

If I provide a UI screenshot:

- Treat it as the design reference.
- Match spacing, alignment, colors, typography, and layout as closely as possible.
- If something is impossible, explain why instead of guessing.

---

# Communication Style

Assume I am not a professional programmer.

When explaining code:

- Use simple language.
- Avoid unnecessary technical jargon.
- Explain the purpose before implementation.
- Show code changes clearly.

---

# Preferred Workflow

For every task:

1. Understand the request.
2. Inspect the relevant files.
3. Explain the implementation plan.
4. Wait for approval if major changes are required.
5. Make the changes.
6. Summarize what changed.