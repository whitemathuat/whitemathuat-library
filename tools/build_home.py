from utils import ROOT_DIR

def count_books():
    novels_dir = ROOT_DIR / "novels"
    if not novels_dir.exists():
        return 0
    # Đếm thực tế tất cả các thư mục con nằm trong thư mục novels
    return sum(1 for p in novels_dir.iterdir() if p.is_dir())

def main():
    # 1. Tính toán số lượng sách
    current_books = count_books()
    
    # 2. Đọc cái khuôn HTML từ thư mục templates
    template_path = ROOT_DIR / "templates" / "home.html"
    html_template = template_path.read_text(encoding="utf-8")
    
    # 3. Đổ số lượng sách vào khuôn HTML
    output_html = html_template.format(book_count=current_books)
    
    # 4. Ghi dữ liệu ra file index.html ở thư mục ngoài cùng
    output_file = ROOT_DIR / "index.html"
    output_file.write_text(output_html, encoding="utf-8")
    print(f"Đã tạo thành công {output_file} (Số lượng thực tế: {current_books} truyện)")

if __name__ == "__main__":
    main()