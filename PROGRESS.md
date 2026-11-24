# PROGRESS

Short status page: rewrite it, do not append a diary. Verification details go in commit messages.

## Where we are (2026-11-24)
- Taken over with `/du-an-cu` (2026-11-24). Live at https://whitemathuat-library.pages.dev (= `main`). Daily work goes on branch `dev`; it goes live only with `/len-mang`.
- Works: home page, library page (2 books: Even Better, Unknown Lover), book pages with Annotation + Info tabs, password gate online.
- **Moving the generator from Python to JavaScript (DECISIONS 4), 4 steps:**
  1. Page builders in JS (`tools/*.js`, `npm run build`): DONE. `npm run compare` shows they make the same pages as Python.
  2. Check command in JS (`npm run check`, `tools/check.js`): DONE, `tools/check.py` removed.
  3. Kindle export reader (`parse_notebook.py`) in JS, no extra library; `notes.json` of both books must come out the same: next.
  4. Remove the Python files, `__pycache__` and `tests/compare_python_js.js`; update CLAUDE.md; look at the Cloudflare preview of `dev`.
- Unfinished / looks off:
  - Links with no page yet (`#`): Đang đọc, Yêu thích, Annotation, Tất cả truyện, Giao diện, Cài đặt (sidebar in `tools/utils.js`); categories Phim, Anime, Manga, Game are disabled.
  - Phone layout: library and book pages lack the `viewport` tag, and no CSS has `@media` rules, so small screens are likely poor.
  - Even Better has an empty `review.md` (Info tab empty, rating 0/10); Unknown Lover has test data (`note_text: test thử`, `rating: x`, folder name `unknown_lover_test`).
  - Covers are heavy (1.7 MB and 0.9 MB), so they load slowly.
  - Small code issues: stray `</span>` in the home title (`templates/home.html`); `_middleware.js` can crash (error 500) on a malformed login header.

## Next steps
1. Finish the JS move: steps 3-4 above (one new chat).
2. Phone-friendly layout + polish (user's wish).
3. More code clean-up, in small safe steps.

## Waiting for the user to try
- Nothing (no visible change so far).

## Things to remember
- User's wishes (2026-11-24): make it look good on phones; improve code quality so it is clean and sensible.
- The project lives in Downloads (not `C:\Users\Admin\Projects`); moving it is possible later.
