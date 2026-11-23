# PROGRESS

Short status page: rewrite it, do not append a diary. Verification details go in commit messages.

## Where we are (2026-11-24)
- Taken over with `/du-an-cu`: notes added, no code changed. Local copy = GitHub `main` (identical), live at https://whitemathuat-library.pages.dev.
- Works: home page, library page (2 books: Even Better, Unknown Lover), book pages with Annotation + Info tabs, password gate online, Python generator.
- Unfinished / looks off:
  - Links with no page yet (`#`): Đang đọc, Yêu thích, Annotation, Tất cả truyện, Giao diện, Cài đặt (sidebar in `tools/utils.py`); categories Phim, Anime, Manga, Game are disabled.
  - Phone layout: library and book pages lack the `viewport` tag, and no CSS has `@media` rules, so small screens are likely poor.
  - Even Better has an empty `review.md` (Info tab empty, rating 0/10); Unknown Lover has test data (`note_text: test thử`, `rating: x`, folder name `unknown_lover_test`).
  - Covers are heavy (1.7 MB and 0.9 MB) → slow loading.
  - Small code issues: stray `</span>` in the home title (`templates/home.html`); `__pycache__` files committed; parsing code duplicated twice in `parse_notebook.py`; `_middleware.js` can crash (error 500) on a malformed login header.

## Next steps (suggestions, not started)
1. Install Python on this PC (needed before any page can be rebuilt), then add a check command.
2. Decide how to work without every push going live (DECISIONS 2).
3. Phone-friendly layout + polish (user's wish).
4. Code clean-up for clarity (user's wish): small, safe steps, one at a time.

## Waiting for the user to try
- Nothing yet.

## Things to remember
- User's wishes (2026-11-24): make it look good on phones; improve code quality so it is clean and sensible.
- The project lives in Downloads (not `C:\Users\Admin\Projects`); moving it is possible later.
