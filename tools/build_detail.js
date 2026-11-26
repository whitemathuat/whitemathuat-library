// Tạo trang từng cuốn sách: templates/detail.html -> novels/<sách>/index.html
// Trang có 2 tab: "Annotation" (ghi chú theo chương, từ notes.json) và "Thông tin" (từ review.md).
import path from "node:path";
import { ROOT_DIR, NOVELS_DIR, readText, writeText, fillTemplate, escape } from "./utils.js";
import { readBooks, parseReview } from "./books.js";
import { renderNav, renderFooter, renderRating } from "./layout.js";

// Mã của chương i (dùng cho link "Theo chương" nhảy tới chương đó)
const chapterId = (i) => `chuong-${i + 1}`;

// Mã của chương con thứ k trong chương i, ví dụ "chuong-1-2"
const subchapterId = (i, k) => `${chapterId(i)}-${k + 1}`;

// Chia ghi chú của một chương cha theo chương con (các mục liền nhau cùng tên chương con).
// Sách không có chương con -> một nhóm duy nhất, name = null.
function groupBySubchapter(entries) {
  const groups = [];
  for (const entry of entries) {
    const name = entry.chapter ?? null;
    const last = groups[groups.length - 1];
    if (last && last.name === name) last.entries.push(entry);
    else groups.push({ name, entries: [entry] });
  }
  return groups;
}

// Cột "Theo chương": tên chương + số ghi chú; chương con (nếu có) thụt vào bên dưới
function renderChapterLinks(sections) {
  return sections
    .map((s, i) => {
      const entries = s.entries ?? [];
      const links = [`<a href="#${chapterId(i)}"><span>${escape(s.title)}</span><b>${entries.length}</b></a>`];
      groupBySubchapter(entries).forEach((g, k) => {
        if (g.name !== null) links.push(`<a class="sub" href="#${subchapterId(i, k)}"><span>${escape(g.name)}</span><b>${g.entries.length}</b></a>`);
      });
      return links.join("\n");
    })
    .join("\n");
}

// Một ghi chú: câu highlight (nếu có), lời ghi chú của mình (nếu có), vị trí trong sách
function renderEntry(entry) {
  const highlight = entry.type === "pair" ? entry.highlight : entry.type === "highlight" ? entry.text : "";
  const note = entry.type === "pair" ? entry.note : entry.type === "note" ? entry.text : "";
  const parts = ['<article class="note">'];
  if (highlight) parts.push(`  <blockquote class="hl">${escape(highlight)}</blockquote>`);
  if (note) parts.push(`  <p class="my-note">${escape(note)}</p>`);
  // Vị trí: "Loc 89", hoặc "Trang 7" khi file Kindle chỉ ghi số trang
  const loc = entry.location != null ? `Loc ${entry.location}` : entry.page != null ? `Trang ${entry.page}` : "Loc";
  parts.push(`  <span class="loc">${escape(loc)}</span>`);
  parts.push("</article>");
  return parts.join("\n");
}

// Các ghi chú của một chương cha: có chương con thì mỗi chương con có tên nhỏ (h3) ở trên
function renderChapterBody(entries, i) {
  return groupBySubchapter(entries)
    .map((g, k) => {
      const notes = g.entries.map(renderEntry).join("\n");
      if (g.name === null) return notes;
      return `<h3 class="subchapter" id="${subchapterId(i, k)}">${escape(g.name)}</h3>\n${notes}`;
    })
    .join("\n");
}

// Một chương: tên chương + các ghi chú
function renderChapters(sections) {
  return sections
    .map((s, i) => `<section class="chapter" id="${chapterId(i)}">
<h2>${escape(s.title)}</h2>
${renderChapterBody(s.entries ?? [], i)}
</section>`)
    .join("\n");
}

// Bài review: mỗi đoạn (cách nhau bằng dòng trống) là một <p>, xuống dòng đơn thành <br>
function renderReviewText(text) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (!paragraphs.length) return '<p class="muted">Chưa viết gì cả.</p>';
  return paragraphs.map((p) => `<p>${escape(p).replace(/\n/g, "<br>")}</p>`).join("\n");
}

// Tab "Thông tin": thẻ link đọc truyện + thẻ review
function renderInfo(review) {
  const meta = review?.meta ?? { links: [] };
  const links = meta.links.length
    ? `<p class="links">${meta.links
        .map((l) => `<a class="btn" href="${escape(l.url)}" target="_blank" rel="noopener">${escape(l.text)} ↗</a>`)
        .join("")}</p>`
    : '<p class="muted">Chưa có link.</p>';
  const noteText = meta.note_text ? `<p class="muted">${escape(meta.note_text)}</p>` : "";
  return `<div class="info-card read">
  <h3>Đọc truyện</h3>
  ${links}
  ${noteText}
</div>
<div class="info-card review">
  <h3>Đôi lời muốn lói</h3>
  ${renderRating(meta.rating ?? "")}
  ${renderReviewText(review?.text ?? "")}
  <p class="muted">Cập nhật: ${escape(meta.date || "—")}</p>
</div>`;
}

export function buildDetail() {
  const template = readText(path.join(ROOT_DIR, "templates", "detail.html"));
  for (const book of readBooks()) {
    const bookDir = path.join(NOVELS_DIR, book.slug);
    const sections = book.data.sections ?? [];
    const html = fillTemplate(template, {
      nav: renderNav("library", "../../"),
      footer: renderFooter("../../"),
      slug: escape(encodeURIComponent(book.slug)), // tên thư mục, cho link nút "Sửa"
      title: escape(book.title),
      author: escape(book.author),
      rating: renderRating(book.rating),
      highlight_count: book.highlights,
      note_count: book.notes,
      chapter_count: book.chapters,
      chapter_links: renderChapterLinks(sections),
      chapters: renderChapters(sections),
      info: renderInfo(parseReview(bookDir)),
    });
    writeText(path.join(bookDir, "index.html"), html);
    console.log(`Đã tạo novels/${book.slug}/index.html`);
  }
}
