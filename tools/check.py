"""Lệnh kiểm tra toàn bộ web: python tools/check.py (chạy từ thư mục gốc).

Làm 3 việc:
1. Tạo lại tất cả các trang (giống build_all.py) -> báo lỗi nếu code Python hỏng.
2. Mỗi cuốn sách trong novels/ phải có đủ notes.json (đọc được), cover.jpg, index.html.
3. Mọi đường link trong các trang (href/src) và trong CSS (url(...)) phải trỏ tới
   file có thật; link "#chuong-x" phải có mục tương ứng trên trang.
Kết thúc bằng "TẤT CẢ ĐỀU ỔN" hoặc danh sách lỗi (mã thoát 1).
"""
import contextlib
import io
import json
import re
import sys

import build_all
from utils import ROOT_DIR, NOVELS_DIR

errors = []


def check_build():
    """Bước 1: tạo lại trang, giấu bớt chữ in ra cho gọn."""
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            build_all.main()
    except Exception as e:  # lỗi gì cũng báo lại
        errors.append(f"Tạo trang bị lỗi: {e!r}")


def check_books():
    """Bước 2: mỗi thư mục sách có đủ file cần thiết."""
    for book in sorted(p for p in NOVELS_DIR.iterdir() if p.is_dir()):
        for name in ("notes.json", "cover.jpg", "index.html"):
            if not (book / name).exists():
                errors.append(f"Sách '{book.name}' thiếu file {name}")
        notes = book / "notes.json"
        if notes.exists():
            try:
                json.loads(notes.read_text(encoding="utf-8"))
            except ValueError as e:
                errors.append(f"Sách '{book.name}': notes.json hỏng ({e})")


def is_external(link):
    return link.startswith(("http://", "https://", "mailto:", "data:", "//"))


def check_file_links(page, links):
    """Link tới file khác: file đó phải tồn tại."""
    for link in links:
        if is_external(link) or link.startswith("#") or not link:
            continue
        path = link.split("#")[0].split("?")[0]
        target = (page.parent / path).resolve()
        if target.is_dir():
            target = target / "index.html"
        if not target.exists():
            errors.append(f"{page.relative_to(ROOT_DIR)}: link hỏng -> {link}")


def check_pages():
    """Bước 3a: link trong các trang HTML đã tạo."""
    pages = [ROOT_DIR / "index.html", ROOT_DIR / "books" / "index.html"]
    pages += sorted(NOVELS_DIR.glob("*/index.html"))
    for page in pages:
        if not page.exists():
            errors.append(f"Thiếu trang {page.relative_to(ROOT_DIR)}")
            continue
        html = page.read_text(encoding="utf-8")
        check_file_links(page, re.findall(r'(?:href|src)="([^"]*)"', html))
        # Link nhảy tới chương (#ten-chuong) phải có id tương ứng
        ids = set(re.findall(r'id="([^"]+)"', html))
        for anchor in re.findall(r'href="#([^"]+)"', html):
            if anchor not in ids:
                errors.append(f"{page.relative_to(ROOT_DIR)}: không có mục #{anchor}")


def check_css():
    """Bước 3b: ảnh/phông chữ gọi trong CSS phải tồn tại."""
    for css in sorted((ROOT_DIR / "css").glob("*.css")):
        text = css.read_text(encoding="utf-8")
        links = re.findall(r'url\(\s*["\']?([^"\')]+)["\']?\s*\)', text)
        check_file_links(css, links)


def main():
    check_build()
    check_books()
    check_pages()
    check_css()
    if errors:
        print(f"CÓ {len(errors)} LỖI:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    print("TẤT CẢ ĐỀU ỔN: tạo trang được, sách đủ file, không có link hỏng.")


if __name__ == "__main__":
    main()
