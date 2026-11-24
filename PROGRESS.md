# PROGRESS

Short status page: rewrite it, do not append a diary. Verification details go in commit messages.

## Where we are (2026-11-25)
- Live at https://whitemathuat-library.pages.dev (= `main`). Daily work on branch `dev`; it goes live only with `/len-mang`. What is not online yet: `git log online..HEAD --oneline`.
- Generator is JavaScript (DECISIONS 4): `npm run parse`, `npm run covers`, `npm run build`, `npm run check`.
- New look, design 2a (DECISIONS 5), done on all 3 pages (home, library, book page; phone-friendly); home has the open-book drawing (6), pinned quote and site icon (7).
- Login gate fixed (DECISIONS 9); covers shrunk to 600 px wide (8).
- Test data cleaned (DECISIONS 10): folder `unknown-lover` (was `unknown_lover_test`), real reading link, both books rated 10. Old book links with `unknown_lover_test` no longer work.
- Still open:
  - Unknown Lover review text ("cả 2 tk làm t điên đầu...") kept as is; user has not said if it is real or a test.
  - Even Better review left empty on purpose (user will write it later).

## Next steps
1. When the user wants: `/len-mang` (lighter covers + login fix + clean data), then check on a real phone.
2. Maybe: edit reviews on the website (IDEAS; needs a plan + OK first).

## Waiting for the user to try
- Library and book pages on a real phone after the next `/len-mang`.
- After `/len-mang`: log in online once (the login box should work as before).

## Things to remember
- User's wishes: look good on phones; clean, sensible code.
- The project lives in Downloads (not `C:\Users\Admin\Projects`); moving it is possible later.
- `assets/thumbnail.png` = the user's original icon picture, kept uncommitted on purpose.
