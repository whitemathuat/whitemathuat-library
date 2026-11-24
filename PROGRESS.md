# PROGRESS

Short status page: rewrite it, do not append a diary. Verification details go in commit messages.

## Where we are (2026-11-25)
- Live at https://whitemathuat-library.pages.dev (= `main`). Daily work on branch `dev`; it goes live only with `/len-mang`. What is not online yet: `git log online..HEAD --oneline`.
- Generator is JavaScript (DECISIONS 4): `npm run parse`, `npm run covers`, `npm run build`, `npm run check`.
- Look 2a done on all 3 pages (DECISIONS 5–7); login gate fixed (9); covers 600 px (8); test data cleaned (10).
- Working on: add/edit books from the website (DECISIONS 11), 3 steps.
  - Step 1 (backend) built on `dev`: save function `functions/api/save-book.js` + GitHub Action `.github/workflows/build-books.yml` + `tools/check_save.js`. Not tested against the real GitHub yet: needs the `GITHUB_TOKEN` secret.
- Reviews: user said they do not matter for now (Unknown Lover text kept, Even Better empty).

## Next steps
1. User creates the GitHub token and puts it in Cloudflare as secret `GITHUB_TOKEN` (Production + Preview). Then redeploy `dev` and open https://dev.whitemathuat-library.pages.dev/api/save-book: must say "Chìa khóa dùng được".
2. Step 2: "Thêm sách" page (upload notebook, preview title/author/notes, save). Test a real save on the dev preview (then delete the test book).
3. Step 3: cover crop (drag/zoom), links, rating, review; edit existing books.
4. `/len-mang` when the user wants.

## Waiting for the user
- The token setup (step 1 above).
- Library and book pages on a real phone.

## Things to remember
- User's wishes: look good on phones; clean, sensible code.
- The project lives in Downloads (not `C:\Users\Admin\Projects`); moving it is possible later.
- `assets/thumbnail.png` = the user's original icon picture, kept uncommitted on purpose.
