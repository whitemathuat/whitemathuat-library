# PROGRESS

Short status page: rewrite it, do not append a diary. Verification details go in commit messages.

## Where we are (2026-11-26)
- Live at https://whitemathuat-library.pages.dev (= `main`). Daily work on branch `dev`; it goes live only with `/len-mang`. What is not online yet: `git log online..HEAD --oneline`.
- Generator is JavaScript (DECISIONS 4): `npm run parse`, `npm run covers`, `npm run build`, `npm run check`.
- Look 2a done on all 3 pages (DECISIONS 5–7); login gate fixed (9); covers 600 px (8); test data cleaned (10).
- Working on: add/edit books from the website (DECISIONS 11), 3 steps.
  - Step 1 (backend) done: `functions/api/save-book.js` + GitHub Action `build-books.yml`. Secrets set for Production and Preview; token check on the dev preview OK.
  - Step 2 done on `dev` (DECISIONS 12): page `books/add.html` ("+ Thêm sách" button on the library page). A real save on the dev preview worked (book `chim-hong-hac`, saved + auto-built by the GitHub Action).
  - The dev preview is behind Cloudflare Access (email code) before the site's own login. Cloudflare loads changed variables only on a new deployment.
- Sub-chapters (on `dev`): Kindle headings like "- 4 > Page 27" give each entry a `chapter` ("4"); the book page shows them as small headings under the parent chapter (and indented in "Theo chương"), name only, no "Chương" prefix. Books without them are unchanged. First such book: `novels/chim-hong-hac` (saved by the user from the website on `dev`, re-parsed). A loose copy "Chim Hồng Hạc Côn Đồ - Notebook.html" is still in the project root, uncommitted.
- Reviews: user said they do not matter for now (Unknown Lover text kept, Even Better empty).

## Next steps
1. Step 3: cover crop (drag/zoom), links, rating, review; edit existing books.
2. `/len-mang` when the user wants.

## Waiting for the user
- Library and book pages on a real phone.

## Things to remember
- User's wishes: look good on phones; clean, sensible code.
- The project lives in Downloads (not `C:\Users\Admin\Projects`); moving it is possible later.
- `assets/thumbnail.png` = the user's original icon picture, kept uncommitted on purpose.
