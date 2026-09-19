import html
import re
from pathlib import Path

# Xác định đường dẫn gốc của dự án
ROOT_DIR = Path(__file__).parent.parent
NOVELS_DIR = ROOT_DIR / "novels"

def slugify(text: str) -> str:
    text = text.lower()
    text = text.replace("–", "-")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")

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

def render_app_sidebar(active_tab, depth_prefix):
    # Xác định tab nào đang được chọn để tô màu tím
    lib_active = 'class="active"' if active_tab == 'library' else ''
    anno_active = 'class="active"' if active_tab == 'annotation' else ''
    
    return f"""
    <aside class="app-sidebar">
        <div class="app-logo">📖 white đọc gây</div>
        <div class="app-section">THƯ VIỆN</div>
        <nav class="app-nav">
            <a href="{depth_prefix}index.html">🏠 Trang chủ</a>
            <a href="{depth_prefix}books/index.html" {lib_active}>📚 Thư viện</a>
            <a href="#">📖 Đang đọc</a>
            <a href="#">🤍 Yêu thích</a>
            <a href="#" {anno_active}>📝 Annotation</a> 
            <a href="#">🗂️ Tất cả truyện</a>
        </nav>
        <div class="app-section">CÀI ĐẶT</div>
        <nav class="app-nav">
            <a href="#">⚙️ Giao diện</a>
            <a href="#">⚙️ Cài đặt</a>
        </nav>
        <div class="app-footer">© white đọc gây</div>
    </aside>
    """