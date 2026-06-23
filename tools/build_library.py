from pathlib import Path
import json
import xml.etree.ElementTree as ET


def count_chapters(book_dir):

    toc_file = book_dir / "toc.ncx"

    if not toc_file.exists():
        return 0

    ns = {
        "ncx": "http://www.daisy.org/z3986/2005/ncx/"
    }

    tree = ET.parse(toc_file)
    root = tree.getroot()

    navpoints = root.findall(
        ".//ncx:navPoint",
        ns
    )

    return len(navpoints)


root = Path(__file__).parent.parent
novels_dir = root / "novels"

books = []

for book_dir in novels_dir.iterdir():

    if not book_dir.is_dir():
        continue

    meta_file = book_dir / "metadata.json"

    if not meta_file.exists():
        continue

    meta = json.loads(meta_file.read_text(encoding="utf-8"))

    chapter_count = count_chapters(book_dir)

    books.append({
        "slug": book_dir.name,
        "title": meta["title"],
        "author": meta["author"],
        "review": meta.get("review", ""),
        "chapters": chapter_count
    })

books.sort(key=lambda x: x["title"])

cards = ""

for book in books:

    cards += f"""
    <div class="library-book-card">

        <a href="novels/{book['slug']}/">
            <img
                class="library-cover"
                src="novels/{book['slug']}/cover.jpg"
                alt="{book['title']}"
            >
        </a>

        <div class="library-book-info">

            <h3>{book['title']}</h3>

            <p class="author">
                {book['author']}
            </p>

            <p class="chapter-count">
                {book['chapters']} chương
            </p>

            <div class="progress">
                <div class="progress-fill"></div>
            </div>

        </div>

    </div>
    """

hero = ""

if books:

    first = books[0]

    hero = f"""
    <section class="continue-reading">

        <div class="continue-content">

            <img
                src="novels/{first['slug']}/cover.jpg"
                class="hero-cover"
            >

            <div>

                <div class="section-label">
                    Tiếp tục đọc
                </div>

                <h2>{first['title']}</h2>

                <p>Chương 1 · Bắt đầu đọc</p>

                <div class="hero-progress">
                    <div class="hero-progress-fill"></div>
                </div>

                <a
                    class="read-now-btn"
                    href="novels/{first['slug']}/"
                >
                    Đọc tiếp
                </a>

            </div>

        </div>

        <div class="hero-art">
            📚
        </div>

    </section>
    """

html = f"""
<!DOCTYPE html>
<html lang="vi">

<head>

<meta charset="utf-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1"
>

<title>White Đọc Gây</title>

<link rel="stylesheet" href="library.css">

</head>

<body>

<div class="app-layout">

    <aside class="sidebar">

        <div class="logo">

            <div class="logo-icon">📖</div>

            <div>

                <h2>white đọc gây</h2>

                <p>Thư viện của bạn</p>

            </div>

        </div>

        <nav>

            <a class="active" href="#">Thư viện</a>
            <a href="#">Đang đọc</a>
            <a href="#">Đã đọc</a>
            <a href="#">Yêu thích</a>
            <a href="#">Tất cả truyện</a>

        </nav>

    </aside>

    <main class="content">

        <header class="topbar">

            <div>

                <h1>Chào mừng trở lại!</h1>

                <p>
                    Hôm nay bạn muốn khám phá
                    câu chuyện nào?
                </p>

            </div>

            <input
                type="search"
                placeholder="Tìm truyện..."
            >

        </header>

        {hero}

        <section class="library-section">

            <div class="section-header">

                <h2>Thư viện của bạn</h2>

            </div>

            <div class="book-grid">

                {cards}

            </div>

        </section>

    </main>

</div>

</body>
</html>
"""

(root / "index.html").write_text(
    html,
    encoding="utf-8"
)

print("Done")