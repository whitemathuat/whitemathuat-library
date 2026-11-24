// Tạo trang từng cuốn sách: templates/detail.html -> novels/<sách>/index.html
// Trang có 2 tab: "Annotation" (ghi chú theo chương, từ notes.json) và "Thông tin" (từ review.md).
import path from "node:path";
import { ROOT_DIR, NOVELS_DIR, readText, writeText, fillTemplate, escape } from "./utils.js";
import { readBooks, parseReview } from "./books.js";
import { renderNav, renderFooter, renderRating } from "./layout.js";

// Mã của chương i (dùng cho link "Theo chương" nhảy tới chương đó)
const chapterId = (i) => `chuong-${i + 1}`;

// Cột "Theo chương": tên chương + số ghi chú
function renderChapterLinks(sections) {
  return sections
    .map((s, i) => `<a href="#${chapterId(i)}"><span>${escape(s.title)}</span><b>${(s.entries ?? []).length}</b></a>`)
    .join("\n");
}

// Một ghi chú: câu highlight (nếu có), lời ghi chú của mình (nếu có), vị trí trong sách
function renderEntry(entry) {
  const highlight = entry.type === "pair" ? entry.highlight : entry.type === "highlight" ? entry.text : "";
  const note = entry.type === "pair" ? entry.note : entry.type === "note" ? entry.text : "";
  const parts = ['<article class="note">'];
  if (highlight) parts.push(`  <blockquote class="hl">${escape(highlight)}</blockquote>`);
  if (note) parts.push(`  <p class="my-note">${escape(note)}</p>`);
  parts.push(`  <span class="loc">Loc ${escape(entry.location ?? "")}</span>`);
  parts.push("</article>");
  return parts.join("\n");
}

// Một chương: tên chương + các ghi chú
function renderChapters(sections) {
  return sections
    .map((s, i) => `<section class="chapter" id="${chapterId(i)}">
<h2>${escape(s.title)}</h2>
${(s.entries ?? []).map(renderEntry).join("\n")}
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
