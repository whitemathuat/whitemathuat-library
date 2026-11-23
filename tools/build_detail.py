import json
import os
from datetime import datetime
from utils import ROOT_DIR, NOVELS_DIR, slugify, escape, count_stats, render_app_sidebar

# --- HÀM MỚI: ĐỌC VÀ XỬ LÝ FILE REVIEW.MD ---
def parse_review(book_dir):
    review_file = book_dir / "review.md"
    if not review_file.exists():
        return None
    
    mtime = os.path.getmtime(review_file)
    real_date = datetime.fromtimestamp(mtime).strftime("%d/%m/%Y")
    
    content = review_file.read_text(encoding="utf-8")
    parts = content.split("---", 1)
    
    # Khởi tạo list chứa các link
    meta = {'links': []} 
    text = ""
    
    if len(parts) == 2:
        meta_text, text = parts
        for line in meta_text.strip().split('\n'):
            if ':' in line:
                k, v = line.split(':', 1)
                k = k.strip()
                v = v.strip()
                
                # Nếu từ khóa là 'link', tách URL và Text bằng dấu '|'
                if k == 'link':
                    link_parts = v.split('|', 1)
                    url = link_parts[0].strip()
                    link_text = link_parts[1].strip() if len(link_parts) > 1 else "Nguồn"
                    meta['links'].append({'url': url, 'text': link_text})
                else:
                    meta[k] = v
    else:
        text = parts[0]
        
    # Ngày "Cập nhật": ưu tiên dòng "date: dd/mm/yyyy" trong review.md
    # (giữ nguyên khi chuyển máy). Không có thì lấy ngày sửa file.
    meta.setdefault('date', real_date)

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
        return '<div id="tab-info" class="tab-content"><p>Chưa có thông tin review.</p></div>'
    
    meta = review_data['meta']
    text = review_data['text']
    
    source_html_parts = []
    
    # 1. Có link thì in các link dàn ngang
    if meta.get('links'):
        source_html_parts.append('<div class="source-flex" style="margin-bottom: 0; flex-wrap: wrap; gap: 12px;">')
        for link in meta['links']:
            source_html_parts.append(f'<a href="{escape(link["url"])}" class="btn-action btn-primary-outline" target="_blank"><span class="icon">↗</span> {escape(link["text"])}</a>')
        source_html_parts.append('</div>')
        
    # 2. Có text thì in text (bất kể ở trên có link hay không)
    if 'note_text' in meta:
        # Nếu có link ở trên rồi thì đẩy text cách xuống một chút (16px), không có link thì ko cần khoảng cách
        margin_top = "16px" if meta.get('links') else "0"
        source_html_parts.append(f'<div class="no-link-text" style="margin-top: {margin_top};">{escape(meta["note_text"])}</div>')
        
    source_html = "".join(source_html_parts)

    return f"""
<div id="tab-info" class="tab-content">
    
    <div class="info-card">
        <div class="info-header">
            <span class="icon">📖</span> Đọc truyện
        </div>
        
        {source_html}
        
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
    <button class="tab" onclick="switchTab(event, 'tab-info')">
        <span style="color:var(--primary); margin-right:6px;">ⓘ</span> Thông tin
    </button>
    <button class="tab active" onclick="switchTab(event, 'tab-annotation')">
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
    html_parts.append('<div id="tab-annotation" class="tab-content active">')
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


def build_book(book_dir):
    notes_file = book_dir / "notes.json"
    if not notes_file.exists():
        return

    data = json.loads(notes_file.read_text(encoding="utf-8"))
    
    # Parse thêm data từ review.md
    review_data = parse_review(book_dir)

    page_html = render_page(data, review_data)
    
    # 1. Đọc khuôn HTML từ thư mục templates
    template_path = ROOT_DIR / "templates" / "detail.html"
    html_template = template_path.read_text(encoding="utf-8")
    
    # 2. Đổ dữ liệu vào khuôn
    # Tạo sidebar với độ sâu "../../" và tab đang mở là 'annotation'
    sidebar_html = render_app_sidebar('annotation', '../../')

    # Đổ cả sidebar và content vào khuôn
    output = html_template.format(sidebar=sidebar_html, content=page_html)

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