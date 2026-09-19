import json
from utils import ROOT_DIR, NOVELS_DIR, escape, count_stats, render_app_sidebar

BOOKS_DIR = ROOT_DIR / "books"

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

# Bắt đầu sửa từ đoạn này trong hàm main():
    cards_html = "".join([render_book_card(b) for b in books])
    
    # 1. Đọc khuôn HTML
    template_path = ROOT_DIR / "templates" / "library.html"
    html_template = template_path.read_text(encoding="utf-8")
    
    # 2. Đổ dữ liệu vào khuôn
    # Tạo sidebar với độ sâu "../" và tab đang mở là 'library'
    sidebar_html = render_app_sidebar('library', '../')

    # Đổ cả sidebar và content vào khuôn
    output_html = html_template.format(sidebar=sidebar_html, content=cards_html)

    (BOOKS_DIR / "index.html").write_text(output_html, encoding="utf-8")
    print(f"Created {BOOKS_DIR / 'index.html'} with {len(books)} books.")

if __name__ == "__main__":
    main()
