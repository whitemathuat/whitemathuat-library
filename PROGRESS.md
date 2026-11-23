# PROGRESS

Short status page: rewrite it, do not append a diary. Verification details go in commit messages.

## Where we are (2026-11-24)
- Taken over with `/du-an-cu` (2026-11-24). Live at https://whitemathuat-library.pages.dev (= `main`). Daily work goes on branch `dev`; it goes live only with `/len-mang`.
- Works: home page, library page (2 books: Even Better, Unknown Lover), book pages with Annotation + Info tabs, password gate online, Python generator.
- Unfinished / looks off:
  - Links with no page yet (`#`): Đang đọc, Yêu thích, Annotation, Tất cả truyện, Giao diện, Cài đặt (sidebar in `tools/utils.py`); categories Phim, Anime, Manga, Game are disabled.
  - Phone layout: library and book pages lack the `viewport` tag, and no CSS has `@media` rules, so small screens are likely poor.
  - Even Better has an empty `review.md` (Info tab empty, rating 0/10); Unknown Lover has test data (`note_text: test thử`, `rating: x`, folder name `unknown_lover_test`).
  - Covers are heavy (1.7 MB and 0.9 MB) → slow loading.
  - Small code issues: stray `</span>` in the home title (`templates/home.html`); `__pycache__` files committed; parsing code duplicated twice in `parse_notebook.py`; `_middleware.js` can crash (error 500) on a malformed login header.
- Python works here (full path, see CLAUDE.md); check command `tools/check.py` added; rebuilt pages match the live ones exactly. Not online yet (on `dev` only; nothing visible changes).

## Next steps (suggestions, not started)
1. Phone-friendly layout + polish (user's wish).
2. Code clean-up for clarity (user's wish): small, safe steps, one at a time.
3. Install BeautifulSoup when the first new book is added.

## Waiting for the user to try
- Nothing yet.

## Things to remember
- User's wishes (2026-11-24): make it look good on phones; improve code quality so it is clean and sensible.
- The project lives in Downloads (not `C:\Users\Admin\Projects`); moving it is possible later.
