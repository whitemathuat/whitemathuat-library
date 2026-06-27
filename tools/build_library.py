from pathlib import Path
import json
import html

NOVELS_DIR = Path("novels")
BOOKS_DIR = Path("books")

def escape(text):
    if text is None:
        return ""
    return html.escape(str(text))

def count_stats(data):
    highlights = 0
    notes = 0
    for section in data.get("sections", []):
        for entry in section.get("entries", []):
            t = entry.get("type")
            if t == "pair":
                highlights += 1
                notes += 1
            elif t == "highlight":
                highlights += 1
            elif t == "note":
                notes += 1
    return highlights, notes

def get_book_data(book_dir):
    notes_file = book_dir / "notes.json"
    if not notes_file.exists():
        return None
    
    try:
        data = json.loads(notes_file.read_text(encoding="utf-8"))
        highlights, notes = count_stats(data)
        return {
            "slug": book_dir.name,
            "title": data.get("title", "Unknown Title"),
            "author": data.get("author", "Unknown Author"),
            "cover": f"../novels/{book_dir.name}/cover.jpg",
            "highlights": highlights,
            "notes": notes
        }
    except Exception as e:
        print(f"Error reading {notes_file}: {e}")
        return None

# Template based on layout from build_detail.py but adapted for library
HTML_TEMPLATE = """<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Thư viện - white đọc gây</title>
    <link rel="stylesheet" href="../detail.css">
    <link rel="stylesheet" href="../library.css">
</head>
<body>
<div class="layout">
    <aside class="app-sidebar">
        <div class="app-logo">📖 white đọc gây</div>
        <div class="app-section">THƯ VIỆN</div>
        <nav class="app-nav">
            <a href="../index.html">🏠 Trang chủ</a>
            <a href="index.html" class="active">📚 Thư viện</a>
            <a href="#">📖 Đang đọc</a>
            <a href="#">🤍 Yêu thích</a>
            <a href="#">📝 Ghi chú</a>
            <a href="#">🗂️ Tất cả truyện</a>
        </nav>
        <div class="app-section">CÀI ĐẶT</div>
        <nav class="app-nav">
            <a href="#">⚙️ Giao diện</a>
            <a href="#">⚙️ Cài đặt</a>
        </nav>
        <div class="app-footer">© white đọc gây</div>
    </aside>

    <main class="page">
        <header class="topbar">
            <div>
                <h1>Thư viện của tôi</h1>
                <p>Khám phá kho tàng kiến thức về các bộ nhiễm sắc thể XY</p>
            </div>
        
        </header>

        <div class="book-grid">
            {content}
        </div>
    </main>
</div>
</body>
</html>
"""

def render_book_card(book):
    return f'''
    <a href="../novels/{book['slug']}/index.html" style="text-decoration: none; color: inherit;">
        <div class="library-book-card">
            <img src="{book['cover']}" alt="{escape(book['title'])}" class="library-cover">
            <div class="library-book-info">
                <h3>{escape(book['title'])}</h3>
                <p class="author">{escape(book['author'])}</p>
                <div class="chapter-count">
                    {book['highlights']} highlights • {book['notes']} ghi chú
                </div>
            </div>
        </div>
    </a>
    '''

def main():
    if not NOVELS_DIR.exists():
        print("novels folder not found.")
        return

    BOOKS_DIR.mkdir(exist_ok=True)

    books = []
    for book_dir in sorted(NOVELS_DIR.iterdir()):
        if not book_dir.is_dir():
            continue
        data = get_book_data(book_dir)
        if data:
            books.append(data)

    cards_html = "".join([render_book_card(b) for b in books])
    output_html = HTML_TEMPLATE.format(content=cards_html)

    (BOOKS_DIR / "index.html").write_text(output_html, encoding="utf-8")
    print(f"Created {BOOKS_DIR / 'index.html'} with {len(books)} books.")

if __name__ == "__main__":
    main()
