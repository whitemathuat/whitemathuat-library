# PROGRESS

Short status page: rewrite it, do not append a diary. Verification details go in commit messages.

## Where we are (2026-11-24)
- Live at https://whitemathuat-library.pages.dev (= `main`). Daily work on branch `dev`; it goes live only with `/len-mang`.
- Generator is JavaScript (DECISIONS 4): `npm run parse`, `npm run build`, `npm run check`.
- **New look, design 2a (DECISIONS 5): step 1 of 3 DONE = home page** (phone-friendly). Library and book pages still have the old look (old sidebar, `global.css`, Bookerly).
- The trial designs are in `thu-giao-dien/` (+ older `design-thu/`, photos in `ref/`), NOT committed. `thu-giao-dien/2a-nhin-len-bau-troi/` (`thu-vien.html`, `sach-*.html`, `style.css`) + `thu-giao-dien/_nhin-len-chung.css` are the model for steps 2-3.
- Still open:
  - Even Better has an empty `review.md`; Unknown Lover has test data (`note_text: test thử`, `rating: x`, folder `unknown_lover_test`).
  - Covers are heavy (1.7 MB and 0.9 MB).
  - `_middleware.js` can crash (error 500) on a malformed login header.

## Next steps
1. Design 2a step 2: library page (`templates/library.html`, `tools/build_library.js`, `css/library.css`), using `readBooks()`, `renderNav`/`renderFooter`, `theme.css`. New chat.
2. Design 2a step 3: book page (Annotation + Info tabs). Then remove `global.css`, Bookerly, `renderAppSidebar`, and (after asking the user) the trial folders.
3. When the user wants: `/len-mang`.

## Waiting for the user to try
- Double-click `index.html` to see the new home page (also on a real phone after `/len-mang`).

## Things to remember
- User's wishes: look good on phones; clean, sensible code.
- The project lives in Downloads (not `C:\Users\Admin\Projects`); moving it is possible later.
