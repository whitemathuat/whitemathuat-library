# CLAUDE.md — white đọc gây (whitemathuat-library)

General rules (who the user is, Vietnamese replies, working rules, notes system, this PC's quirks, local dev server, /xong and /len-mang routines) are in the shared file `C:\Users\Admin\.claude\CLAUDE.md`, loaded in every project. This file holds only what is specific to this app.

## What this project is
A private personal reading library, "white đọc gây". Kindle notebook exports (highlights + notes per chapter) become a static website: home page, library page (book cards), and one page per book with an "Annotation" tab (notes by chapter) and an "Info" tab (reading links, rating, review from `review.md`).
Status and next steps: PROGRESS.md. Rules in force + decisions: DECISIONS.md. Ideas: IDEAS.md.
Taken over 2026-11-24 with `/du-an-cu` (notes only, no code changed).

## Older AI rule files (still in force)
`README_PROJECT.md` and `PROJECT_STRUCTURE.md` were written for an AI before this setup. Follow them (small focused changes, CSS first → template → Python, list files to change and wait for OK on big changes); they agree with the shared rules.
Out of date in `PROJECT_STRUCTURE.md`: `build_index.py` does not exist (it is `build_home.py` + `build_library.py`); `note.json` is really `novels/<book>/notes.json` (one per book).

## Tech stack (as found)
- Static site: plain HTML + CSS (`css/global.css` + one CSS per page), font Bookerly (`fonts/`). No JavaScript framework, no npm, no `package.json`.
- Generator: Python scripts in `tools/` fill the templates in `templates/` and write the pages:
  - `templates/home.html` → `index.html` (book count), `templates/library.html` → `books/index.html`, `templates/detail.html` → `novels/<book>/index.html`.
  - `tools/parse_notebook.py`: `novels/<book>/notebook.html` (Kindle export) → `notes.json`. Needs the extra library BeautifulSoup (`bs4`) and must be run from the project root.
  - Shared helpers: `tools/utils.py` (left sidebar, counts, slug).
- Generated pages ARE committed (Cloudflare serves the folder as is, no build step). Edit templates/CSS/Python, then rebuild; never hand-edit generated `index.html` files.
- One book = one folder `novels/<slug>/`: `notebook.html`, `notes.json`, `cover.jpg`, `review.md` (header lines `link: URL | text`, `note_text:`, `rating:`, then `---`, then the review text).
- Password gate online: `functions/_middleware.js` (browser login box, Cloudflare variables `USERNAME` and `PASSWORD`; no secret in code).

## Commands
- View locally: double-click `index.html` (opens in the browser, no server needed; no password locally). No dev server, no port.
- Rebuild pages: `python tools/build_all.py` (from the project root). Add a book: put `notebook.html` + `cover.jpg` (+ `review.md`) in `novels/<slug>/`, run `python tools/parse_notebook.py`, then `build_all.py`.
- **Python is NOT installed on this PC yet** (only the Windows Store shortcut), so pages cannot be rebuilt here until it is.
- Checks: no check command yet.
- GitHub: https://github.com/whitemathuat/whitemathuat-library (branch `main`).
- Online: https://whitemathuat-library.pages.dev (Cloudflare Pages project `whitemathuat-library`, password-protected).
- Deploy: Cloudflare is connected to GitHub, so **every push to `main` goes live automatically** (see DECISIONS 2). Tag `online` = the live commit; move it after each push to `main`.
- Wrangler is not installed here; for read-only Cloudflare checks use the copy in `C:\Users\Admin\Downloads\white_translator\node_modules\.bin\wrangler`.
