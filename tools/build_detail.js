// Tạo trang từng cuốn sách: templates/detail.html -> novels/<sách>/index.html
// Trang có 2 tab: "Thông tin" (từ review.md) và "Annotation" (từ notes.json).
import fs from "node:fs";
import path from "node:path";
import {
  ROOT_DIR, NOVELS_DIR, readText, writeText, listDirs, fillTemplate,
  slugify, escape, countStats, renderAppSidebar,
} from "./utils.js";
import { parseReview } from "./books.js";

function renderHeader(title, author, highlights, notes) {
  return `
<div class="book-header">
    <div class="book-cover-wrap">
        <img src="cover.jpg" class="book-cover" alt="${escape(title)}">
    </div>
    <div class="book-meta">
        <h1>${escape(title)}</h1>
        <p>${escape(author)}</p>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${highlights}</div>
                <div class="stat-label">Highlights</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${notes}</div>
                <div class="stat-label">Annotation</div> </div>
        </div>
    </div>
</div>
`;
}

function renderInfoTab(review) {
  if (!review) {
    return '<div id="tab-info" class="tab-content"><p>Chưa có thông tin review.</p></div>';
  }
  const { meta, text } = review;
  const parts = [];

  // 1. Có link thì in các nút link dàn ngang
  if (meta.links.length) {
    parts.push('<div class="source-flex" style="margin-bottom: 0; flex-wrap: wrap; gap: 12px;">');
    for (const link of meta.links) {
      parts.push(`<a href="${escape(link.url)}" class="btn-action btn-primary-outline" target="_blank"><span class="icon">↗</span> ${escape(link.text)}</a>`);
    }
    parts.push("</div>");
  }

  // 2. Có dòng note_text thì in ra (có link ở trên thì cách xuống 16px)
  if ("note_text" in meta) {
    const marginTop = meta.links.length ? "16px" : "0";
    parts.push(`<div class="no-link-text" style="margin-top: ${marginTop};">${escape(meta.note_text)}</div>`);
  }

  const sourceHtml = parts.join("");

  return `
<div id="tab-info" class="tab-content">

    <div class="info-card">
        <div class="info-header">
            <span class="icon">📖</span> Đọc truyện
        </div>

        ${sourceHtml}

    </div>

    <div class="info-card">
        <div class="review-header">
            <div class="info-header" style="margin-bottom:0;">
                <span class="icon">✏️</span> Đôi lời muốn lói
            </div>
            <div class="rating-badge">
                <span>⭐</span> ${escape(meta.rating ?? "0")} / 10
            </div>
        </div>

        <div class="review-content">${escape(text)}</div>

        <div class="review-date">Cập nhật: ${escape(meta.date ?? "")}</div>
    </div>

</div>
`;
}

// Cột "Theo chương" bên trái phần ghi chú
function renderChapterList(data) {
  const parts = [`
<aside class="sidebar">
<div class="sidebar-card chapter-list">
<h3>Theo chương</h3>
`];
  for (const section of data.sections ?? []) {
    const sectionId = "chapter-" + slugify(section.title);
    const count = (section.entries ?? []).length;
    parts.push(`
<a href="#${sectionId}" class="sidebar-row chapter-link">
    <span>${escape(section.title)}</span>
    <span>${count}</span>
</a>
`);
  }
  parts.push(`
</div>
</aside>
`);
  return parts.join("");
}

// Một thẻ ghi chú: highlight, ghi chú, hoặc cả hai (pair)
function renderEntry(entry) {
  const parts = ['<div class="note-card">'];
  if (entry.type === "pair") {
    parts.push(`<div class="highlight">${escape(entry.highlight ?? "")}</div>`);
    parts.push(`<div class="annotation">💬 ${escape(entry.note ?? "")}</div>`);
  } else if (entry.type === "highlight") {
    parts.push(`<div class="highlight">${escape(entry.text ?? "")}</div>`);
  } else if (entry.type === "note") {
    parts.push(`<div class="annotation">💬 ${escape(entry.text ?? "")}</div>`);
  }
  parts.push(`<div class="location">Loc ${entry.location ?? ""}</div>`);
  parts.push("</div>");
  return parts.join("");
}

// Một chương (bấm vào tên chương để mở/đóng)
function renderSection(section) {
  const sectionId = "chapter-" + slugify(section.title);
  const parts = [`<details class="section" id="${sectionId}" open><summary>${escape(section.title)}</summary>`];
  for (const entry of section.entries ?? []) parts.push(renderEntry(entry));
  parts.push("</details>");
  return parts.join("");
}

// Đoạn script chạy trên trình duyệt để đổi qua lại giữa 2 tab
const TAB_SCRIPT = `
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
`;

const TABS = `
<div class="tabs">
    <button class="tab" onclick="switchTab(event, 'tab-info')">
        <span style="color:var(--primary); margin-right:6px;">ⓘ</span> Thông tin
    </button>
    <button class="tab active" onclick="switchTab(event, 'tab-annotation')">
        <span style="color:var(--primary); margin-right:6px;">💬</span> Annotation
    </button>
</div>
<div class="content">
`;

function renderPage(data, review) {
  const { highlights, notes } = countStats(data);
  const parts = [
    renderHeader(data.title ?? "", data.author ?? "", highlights, notes),
    TABS,
    renderChapterList(data),
    '<main class="notes-area">',
    renderInfoTab(review), // Tab 1: Thông tin
    '<div id="tab-annotation" class="tab-content active">', // Tab 2: Annotation
  ];
  for (const section of data.sections ?? []) parts.push(renderSection(section));
  parts.push("</div>");
  parts.push(TAB_SCRIPT);
  return parts.join("");
}

function buildBook(slug, template) {
  const bookDir = path.join(NOVELS_DIR, slug);
  const notesFile = path.join(bookDir, "notes.json");
  if (!fs.existsSync(notesFile)) return;

  const data = JSON.parse(readText(notesFile));
  const html = fillTemplate(template, {
    sidebar: renderAppSidebar("annotation", "../../"),
    content: renderPage(data, parseReview(bookDir)),
  });

  writeText(path.join(bookDir, "index.html"), html);
  console.log(`Đã tạo novels/${slug}/index.html`);
}

export function buildDetail() {
  if (!fs.existsSync(NOVELS_DIR)) {
    console.log("Không thấy thư mục novels.");
    return;
  }
  const template = readText(path.join(ROOT_DIR, "templates", "detail.html"));
  for (const slug of listDirs(NOVELS_DIR)) buildBook(slug, template);
}
