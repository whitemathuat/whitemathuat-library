# PROGRESS

Short status page: rewrite it, do not append a diary. Verification details go in commit messages.

## Where we are (2026-11-24)
- Live at https://whitemathuat-library.pages.dev (= `main`). Daily work on branch `dev`; it goes live only with `/len-mang`.
- Generator is JavaScript (DECISIONS 4): `npm run parse`, `npm run build`, `npm run check`.
- **New look, design 2a (DECISIONS 5): DONE on all 3 pages** (home, library, book page; phone-friendly). Old look removed (`global.css`, Bookerly, left sidebar). Not online yet: see `git log online..HEAD --oneline`.
- Trial design folders (`thu-giao-dien/`, `design-thu/`, `ref/`) deleted 2026-11-24 (user OK'd).
- Home page: book covers on the cloud replaced by an open-book drawing (DECISIONS 6).
- Still open:
  - Even Better has an empty `review.md`; Unknown Lover has test data (`note_text: test thử`, `rating: x`, folder `unknown_lover_test`).
  - Covers are heavy (1.7 MB and 0.9 MB; only the library and book pages use them now).
  - `_middleware.js` can crash (error 500) on a malformed login header.

## Next steps
1. User OK'd the new book page. When the user wants: `/len-mang` (then check on a real phone).
2. Then pick from "Still open" (lighter covers, middleware fix, clean test data).

## Things to remember
- User's wishes: look good on phones; clean, sensible code.
- The project lives in Downloads (not `C:\Users\Admin\Projects`); moving it is possible later.
