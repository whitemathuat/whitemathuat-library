from pathlib import Path
import json
import html
import re
import os                                 # Thêm dòng này
from datetime import datetime

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

# --- HÀM MỚI: ĐỌC VÀ XỬ LÝ FILE REVIEW.MD ---
def parse_review(book_dir):
    review_file = book_dir / "review.md"
    if not review_file.exists():
        return None
    
    # Lấy ngày cập nhật thật của file review.md (Yêu cầu 4)
    mtime = os.path.getmtime(review_file)
    real_date = datetime.fromtimestamp(mtime).strftime("%d/%m/%Y")
    
    content = review_file.read_text(encoding="utf-8")
    parts = content.split("---", 1)
    
    meta = {}
    text = ""
    
    if len(parts) == 2:
        meta_text, text = parts
        for line in meta_text.strip().split('\n'):
            if ':' in line:
                k, v = line.split(':', 1)
                meta[k.strip()] = v.strip()
    else:
        text = parts[0]
        
    # Ghi đè ngày thật vào meta
    meta['date'] = real_date
        
    return {"meta": meta, "text": text.strip()}

def render_header(title, author, highlights, notes):
    return f"""
<div class="book-header">
    <div class="book-cover-wrap">
        <img src="cover.jpg" class="book-cover" alt="{escape(title)}">
    </div>
    <div class="book-meta">
        <h1>{escape(title)}</h1>
        <p>{escape(author)}</p>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">{highlights}</div>
                <div class="stat-label">Highlights</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{notes}</div>
                <div class="stat-label">Annotation</div> </div>
        </div>
    </div>
</div>
"""

def render_info_tab(review_data):
    if not review_data:
        return '<div id="tab-info" class="tab-content active"><p>Chưa có thông tin review.</p></div>'
    
    meta = review_data['meta']
    text = review_data['text']
    
    # Xử lý logic hiển thị Nguồn đọc (Yêu cầu 1)
    if 'read_link' in meta:
        source_html = f'<a href="{escape(meta["read_link"])}" class="btn-action btn-primary-outline" target="_blank"><span class="icon">↗</span> Nguồn</a>'
    elif 'no_link' in meta:
        source_html = f'<div class="no-link-text">{escape(meta["no_link"])}</div>'
    else:
        source_html = ''

    return f"""
<div id="tab-info" class="tab-content active">
    
    <div class="info-card">
        <div class="info-header">
            <span class="icon">📖</span> Đọc truyện
        </div>
        
        <div class="source-flex" style="margin-bottom: 0;">
            {source_html}
        </div>
    </div>

    <div class="info-card">
        <div class="review-header">
            <div class="info-header" style="margin-bottom:0;">
                <span class="icon">✏️</span> Đôi lời muốn lói
            </div>
            <div class="rating-badge">
                <span>⭐</span> {escape(meta.get('rating', '0'))} / 10
            </div>
        </div>
        
        <div class="review-content">{escape(text)}</div>
        
        <div class="review-date">Cập nhật: {escape(meta.get('date', ''))}</div>
    </div>

</div>
"""

def render_sidebar(data):
    html_parts = []
    html_parts.append("""
<aside class="sidebar">
<div class="sidebar-card chapter-list">
<h3>Theo chương</h3>
""")
    for section in data.get("sections", []):
        section_id = "chapter-" + slugify(section["title"])
        card_count = len(section.get("entries", []))
        html_parts.append(f"""
<a href="#{section_id}" class="sidebar-row chapter-link">
    <span>{escape(section["title"])}</span>
    <span>{card_count}</span>
</a>
""")
    html_parts.append("""
</div>
</aside>
""")
    return "".join(html_parts)

def render_entry(entry):
    entry_type = entry.get("type")
    location = entry.get("location", "")
    html_parts = []
    html_parts.append('<div class="note-card">')

    if entry_type == "pair":
        html_parts.append(f'<div class="highlight">{escape(entry.get("highlight", ""))}</div>')
        html_parts.append(f'<div class="annotation">💬 {escape(entry.get("note", ""))}</div>')
    elif entry_type == "highlight":
        html_parts.append(f'<div class="highlight">{escape(entry.get("text", ""))}</div>')
    elif entry_type == "note":
        html_parts.append(f'<div class="annotation">💬 {escape(entry.get("text", ""))}</div>')

    html_parts.append(f'<div class="location">Loc {location}</div>')
    html_parts.append("</div>")
    return "".join(html_parts)

def render_section(section):
    section_id = "chapter-" + slugify(section["title"])
    html_parts = []
    html_parts.append(f'<details class="section" id="{section_id}" open><summary>{escape(section["title"])}</summary>')
    for entry in section.get("entries", []):
        html_parts.append(render_entry(entry))
    html_parts.append('</details>')
    return "".join(html_parts)

def render_page(data, review_data):
    title = data.get("title", "")
    author = data.get("author", "")
    total_highlights, total_notes = count_stats(data)

    html_parts = []
    
    # Header tổng
    html_parts.append(render_header(title, author, total_highlights, total_notes))

    # Cụm điều hướng Tab mới (có hàm onclick của JS)
    html_parts.append("""
<div class="tabs">
    <button class="tab active" onclick="switchTab(event, 'tab-info')">
        <span style="color:var(--primary); margin-right:6px;">ⓘ</span> Thông tin
    </button>
    <button class="tab" onclick="switchTab(event, 'tab-annotation')">
        <span style="color:var(--primary); margin-right:6px;">💬</span> Annotation
    </button>
</div>
<div class="content">
""")
    
    # Sidebar
    html_parts.append(render_sidebar(data))

    html_parts.append('<main class="notes-area">')
    
    # NỘI DUNG TAB 1: Thông tin
    html_parts.append(render_info_tab(review_data))
    
    # NỘI DUNG TAB 2: Annotation (Ghi chú cũ)
    html_parts.append('<div id="tab-annotation" class="tab-content">')
    for section in data.get("sections", []):
        html_parts.append(render_section(section))
    html_parts.append('</div>') # Đóng tab-annotation

    html_parts.append("""
</main>
</div>

<script>
function switchTab(evt, tabId) {
    // Ẩn tất cả tab
    var tabContents = document.getElementsByClassName("tab-content");
    for (var i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }
    // Bỏ chọn tất cả nút tab
    var tabLinks = document.getElementsByClassName("tab");
    for (var i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove("active");
    }
    // Hiện tab đang bấm
    document.getElementById(tabId).classList.add("active");
    evt.currentTarget.classList.add("active");

    // YÊU CẦU 3: Ẩn/Hiện cột sidebar (Theo chương)
    var sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        if (tabId === 'tab-info') {
            sidebar.style.display = 'none'; // Ẩn khi ở tab Thông tin
        } else {
            sidebar.style.display = 'block'; // Hiện khi ở tab Annotation
        }
    }
}

// Chạy mặc định khi load trang để ẩn sidebar ngay từ đầu nếu tab Info đang mở
window.onload = function() {
    var activeTab = document.querySelector('.tab-content.active');
    var sidebar = document.querySelector('.sidebar');
    if (activeTab && activeTab.id === 'tab-info' && sidebar) {
        sidebar.style.display = 'none';
    }
}
</script>
""")
    return "".join(html_parts)


HTML_TEMPLATE = """<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="../../detail.css">
</head>
<body>
<div class="layout">
    <aside class="app-sidebar">
        <div class="app-logo">📖 white đọc gây</div>
        <div class="app-section">THƯ VIỆN</div>
        <nav class="app-nav">
            <a href="../../index.html">🏠 Trang chủ</a>
            <a href="../../books/index.html">📚 Thư viện</a>
            <a href="#">📖 Đang đọc</a>
            <a href="#">🤍 Yêu thích</a>
            <a href="#" class="active">📝 Annotation</a> <a href="#">🗂️ Tất cả truyện</a>
        </nav>
        <div class="app-section">CÀI ĐẶT</div>
        <nav class="app-nav">
            <a href="#">⚙️ Giao diện</a>
            <a href="#">⚙️ Cài đặt</a>
        </nav>
        <div class="app-footer">© white đọc gây</div>
    </aside>
    <main class="page">
        {content}
    </main>
</div>
</body>
</html>
"""

def build_book(book_dir):
    notes_file = book_dir / "notes.json"
    if not notes_file.exists():
        return

    data = json.loads(notes_file.read_text(encoding="utf-8"))
    
    # Parse thêm data từ review.md
    review_data = parse_review(book_dir)

    page_html = render_page(data, review_data)
    output = HTML_TEMPLATE.format(content=page_html)

    output_file = book_dir / "index.html"
    output_file.write_text(output, encoding="utf-8")
    print(f"Created {output_file}")


def main():
    if not NOVELS_DIR.exists():
        print("novels folder not found.")
        return
    for book_dir in sorted(NOVELS_DIR.iterdir()):
        if not book_dir.is_dir():
            continue
        build_book(book_dir)

if __name__ == "__main__":
    main()