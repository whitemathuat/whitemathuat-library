from pathlib import Path

# Xác định vị trí thư mục gốc của dự án (đi ngược lên 1 cấp từ thư mục tools)
ROOT_DIR = Path(__file__).parent.parent

def count_books():
    novels_dir = ROOT_DIR / "novels"
    if not novels_dir.exists():
        return 0
    # Đếm thực tế tất cả các thư mục con nằm trong thư mục novels
    return sum(1 for p in novels_dir.iterdir() if p.is_dir())

HTML_TEMPLATE = """<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>white đọc gây</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div class="app-container">
        
        <nav class="top-nav">
            <a href="index.html" class="nav-brand">
                <span style="font-size: 24px; color: var(--primary);">📖</span> 
                white đọc gây
            </a>
        </nav>

        <section class="hero">
            <div class="hero-content">
                <h1>Luận văn nghiên cứu về<br> Tương tác song nhiễm sắc thể XY</span></h1>
                <p>Nghiên cứu hiện tượng hai bộ nhiễm sắc thể XY khi đặt cạnh nhau có khả năng kích thích não bộ tiết ra serotonin, dopamine và oxytocin với nồng độ cao bất thường ở cá thể quan sát.</p>
            </div>
            <div class="hero-image">
                <img src="assets/hero-illustration.png" alt="Sổ tay và cà phê">
            </div>
        </section>

        <section>
            <div class="section-header">
                <h2>Khám phá thư viện của bạn</h2>
            </div>
            
            <div class="categories-grid">
                <a href="books/index.html" class="cat-card">
                    <div class="cat-icon">📚</div>
                    <div class="cat-name">Sách</div>
                    <div class="cat-count c-book">{book_count}</div>
                    <div class="cat-label">tác phẩm</div>
                </a>
                
                <a href="#" class="cat-card disabled">
                    <div class="cat-icon">🎬</div>
                    <div class="cat-name">Phim</div>
                    <div class="cat-count c-movie">-</div>
                    <div class="cat-label">tác phẩm</div>
                </a>
                
                <a href="#" class="cat-card disabled">
                    <div class="cat-icon">📺</div>
                    <div class="cat-name">Anime</div>
                    <div class="cat-count c-anime">-</div>
                    <div class="cat-label">tác phẩm</div>
                </a>
                
                <a href="#" class="cat-card disabled">
                    <div class="cat-icon">📗</div>
                    <div class="cat-name">Manga</div>
                    <div class="cat-count c-manga">-</div>
                    <div class="cat-label">tác phẩm</div>
                </a>

                <a href="#" class="cat-card disabled">
                    <div class="cat-icon">🎮</div>
                    <div class="cat-name">Game</div>
                    <div class="cat-count c-game">-</div>
                    <div class="cat-label">tác phẩm</div>
                </a>
            </div>
        </section>

    </div>

</body>
</html>
"""

def main():
    # Tiến hành đếm số sách thật trong thư mục novels
    current_books = count_books()
    
    # Điền số lượng vào mẫu HTML
    output_html = HTML_TEMPLATE.format(book_count=current_books)
    
    # Ghi dữ liệu ra file index.html ở thư mục ngoài cùng
    output_file = ROOT_DIR / "index.html"
    output_file.write_text(output_html, encoding="utf-8")
    print(f"Đã tạo thành công {output_file} (Số lượng thực tế: {current_books} truyện)")

if __name__ == "__main__":
    main()