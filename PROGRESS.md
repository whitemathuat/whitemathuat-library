# PROGRESS

Short status page: rewrite it, do not append a diary. Verification details go in commit messages.

## Where we are (2026-11-26)
- Live at https://whitemathuat-library.pages.dev (= `main`). Daily work on branch `dev`; it goes live only with `/len-mang`. What is not online yet: `git log online..HEAD --oneline`.
- Generator is JavaScript (DECISIONS 4): `npm run parse`, `npm run covers`, `npm run build`, `npm run check`.
- Look 2a done on all 3 pages (DECISIONS 5–7); login gate fixed (9); covers 600 px (8); test data cleaned (10).
- Working on: add/edit books from the website (DECISIONS 11), 3 steps.
  - Step 1 (backend) done: `functions/api/save-book.js` + GitHub Action `build-books.yml`. Secrets set for Production and Preview; token check on the dev preview OK.
  - Step 2 done on `dev` (DECISIONS 12): page `books/add.html` ("+ Thêm sách" button on the library page). Tested on this PC with a fake save; a real save on the dev preview has NOT run yet.
  - The dev preview is behind Cloudflare Access (email code) before the site's own login. Cloudflare loads changed variables only on a new deployment.
- Reviews: user said they do not matter for now (Unknown Lover text kept, Even Better empty).

## Next steps
1. User tries a real save on https://dev.whitemathuat-library.pages.dev/books/add.html with a test book; check the GitHub Action runs and the book appears; then delete the test book (Claude does it).
2. Step 3: cover crop (drag/zoom), links, rating, review; edit existing books.
3. `/len-mang` when the user wants.

## Waiting for the user
- The real save test (step 1 above).
- Library and book pages on a real phone.

## Things to remember
- User's wishes: look good on phones; clean, sensible code.
- The project lives in Downloads (not `C:\Users\Admin\Projects`); moving it is possible later.
- `assets/thumbnail.png` = the user's original icon picture, kept uncommitted on purpose.
