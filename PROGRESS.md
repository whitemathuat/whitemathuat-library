# PROGRESS

Short status page: rewrite it, do not append a diary. Verification details go in commit messages.

## Where we are (2026-11-25)
- Live at https://whitemathuat-library.pages.dev (= `main`). Daily work on branch `dev`; it goes live only with `/len-mang`. What is not online yet: `git log online..HEAD --oneline`.
- Generator is JavaScript (DECISIONS 4): `npm run parse`, `npm run covers`, `npm run build`, `npm run check`.
- New look, design 2a (DECISIONS 5), done on all 3 pages (home, library, book page; phone-friendly); home has the open-book drawing (6), pinned quote and site icon (7).
- Covers shrunk to 600 px wide (1694 KB → 107 KB, 900 KB → 52 KB); `npm run check` now flags heavy covers (DECISIONS 8).
- Still open:
  - `_middleware.js` can crash (error 500) on a malformed login header.
  - Even Better has an empty `review.md`; Unknown Lover has test data (`note_text: test thử`, `rating: x`, folder `unknown_lover_test`). Needs the user's real text, or their OK to leave it empty.

## Next steps
1. When the user wants: `/len-mang` for the lighter covers, then check on a real phone.
2. Then: middleware fix, then clean test data (with the user's content).

## Waiting for the user to try
- Library and book pages on a real phone after the next `/len-mang` (should open faster).

## Things to remember
- User's wishes: look good on phones; clean, sensible code.
- The project lives in Downloads (not `C:\Users\Admin\Projects`); moving it is possible later.
- `assets/thumbnail.png` = the user's original icon picture, kept uncommitted on purpose.
