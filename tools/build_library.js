// Tạo trang thư viện: templates/library.html -> books/index.html (thẻ từng cuốn sách).
import fs from "node:fs";
import path from "node:path";
import {
  ROOT_DIR, NOVELS_DIR, readText, writeText, listDirs, fillTemplate,
  escape, countStats, renderAppSidebar,
} from "./utils.js";

const BOOKS_DIR = path.join(ROOT_DIR, "books");

// Đọc thông tin một cuốn sách từ notes.json (không có hoặc hỏng thì bỏ qua).
function getBookData(slug) {
  const notesFile = path.join(NOVELS_DIR, slug, "notes.json");
  if (!fs.existsSync(notesFile)) return null;
  try {
    const data = JSON.parse(readText(notesFile));
    const { highlights, notes } = countStats(data);
    return {
      slug,
      title: data.title ?? "Unknown Title",
      author: data.author ?? "Unknown Author",
      cover: `../novels/${slug}/cover.jpg`,
      highlights,
      notes,
    };
  } catch (e) {
    console.log(`Lỗi đọc ${notesFile}: ${e.message}`);
    return null;
  }
}

function renderBookCard(book) {
  return `
    <a href="../novels/${book.slug}/index.html" style="text-decoration: none; color: inherit;">
        <div class="library-book-card">
            <img src="${book.cover}" alt="${escape(book.title)}" class="library-cover">
            <div class="library-book-info">
                <h3>${escape(book.title)}</h3>
                <p class="author">${escape(book.author)}</p>
                <div class="chapter-count">
                    ${book.highlights} highlights • ${book.notes} ghi chú
                </div>
            </div>
        </div>
    </a>
    `;
}

export function buildLibrary() {
  if (!fs.existsSync(NOVELS_DIR)) {
    console.log("Không thấy thư mục novels.");
    return;
  }
  fs.mkdirSync(BOOKS_DIR, { recursive: true });

  const books = listDirs(NOVELS_DIR).map(getBookData).filter(Boolean);
  const cards = books.map(renderBookCard).join("");

  const template = readText(path.join(ROOT_DIR, "templates", "library.html"));
  const html = fillTemplate(template, {
    sidebar: renderAppSidebar("library", "../"),
    content: cards,
  });

  writeText(path.join(BOOKS_DIR, "index.html"), html);
  console.log(`Đã tạo books/index.html (${books.length} cuốn)`);
}
