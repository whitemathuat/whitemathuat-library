# PROGRESS

Short status page: rewrite it, do not append a diary. Verification details go in commit messages.

## Where we are (2026-11-26)
- Live at https://whitemathuat-library.pages.dev (= `main`). Daily work on branch `dev`; it goes live only with `/len-mang`. What is not online yet: `git log online..HEAD --oneline`.
- Generator is JavaScript (DECISIONS 4): `npm run parse`, `npm run covers`, `npm run build`, `npm run check`.
- Look 2a done on all 3 pages (DECISIONS 5–7); login gate fixed (9); covers 600 px (8); test data cleaned (10).
- Add/edit books from the website (DECISIONS 11), 3 steps: all done on `dev`.
  - Step 1 (backend) done: `functions/api/save-book.js` + GitHub Action `build-books.yml`. Secrets set for Production and Preview; token check on the dev preview OK.
  - Step 2 done on `dev` (DECISIONS 12): page `books/add.html` ("+ Thêm sách" button on the library page). A real save on the dev preview worked (book `chim-hong-hac`, saved + auto-built by the GitHub Action).
  - Step 3a+3b done on `dev` (DECISIONS 13): cover drag/zoom frame (2:3, saved 600×900), reading links, rating, short note and review on the add page. Not yet tried by the user on the dev preview.
  - Step 3c done on `dev` (DECISIONS 14): "Sửa" button on each book page → `books/add.html?sua=<slug>`, pre-filled (cover in the crop frame, links, rating, note, review); Kindle file optional; only changed parts are sent; date becomes today. Not yet tried by the user online.
  - The dev preview is behind Cloudflare Access (email code) before the site's own login. Cloudflare loads changed variables only on a new deployment.
- Sub-chapters (on `dev`): Kindle headings like "- 4 > Page 27" give each entry a `chapter` ("4"); the book page shows them as small headings under the parent chapter (and indented in "Theo chương"), name only, no "Chương" prefix. Books without them are unchanged. First such book: `novels/chim-hong-hac` (saved by the user from the website on `dev`, re-parsed). A loose copy "Chim Hồng Hạc Côn Đồ - Notebook.html" is still in the project root, uncommitted.
- Reviews: user said they do not matter for now (Unknown Lover text kept, Even Better empty).

## Next steps
1. User tries adding (3a+3b) and editing (3c) a book on the dev preview (real phone: two-finger zoom was not tested by machine; a real save of an edit was not tested).
2. `/len-mang` when the user wants.
3. Loose Kindle files in the project root ("Chim Hồng Hạc…", "Đại Dương Đen…"): uncommitted copies, can be deleted once the user agrees.

## Waiting for the user
- Library and book pages on a real phone.

## Things to remember
- User's wishes: look good on phones; clean, sensible code.
- The project lives in Downloads (not `C:\Users\Admin\Projects`); moving it is possible later.
- `assets/thumbnail.png` = the user's original icon picture, kept uncommitted on purpose.
