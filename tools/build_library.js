// Tạo trang thư viện: templates/library.html -> books/index.html
// Mỗi cuốn sách một thẻ giấy (bìa, điểm, tên, tác giả, số liệu), mới cập nhật đứng đầu.
// Sau đó là các kệ "sắp có" (Phim, Anime, Manga, Game), chưa bấm được.
import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR, readText, writeText, fillTemplate, escape } from "./utils.js";
import { readBooks } from "./books.js";
import { renderNav, renderFooter, renderRating } from "./layout.js";

const BOOKS_DIR = path.join(ROOT_DIR, "books");
const SOON_SHELVES = ["Phim", "Anime", "Manga", "Game"];

function renderBookCard(book) {
  return `<a class="card" href="../novels/${book.slug}/index.html">
  <div class="card-cover"><img src="../novels/${book.slug}/cover.jpg" alt="Bìa ${escape(book.title)}" loading="lazy"></div>
  ${renderRating(book.rating)}
  <h3>${escape(book.title)}</h3>
  <p class="author">${escape(book.author)}</p>
  <p class="card-stats"><span><b>${book.highlights}</b> highlight</span><span><b>${book.notes}</b> ghi chú</span><span><b>${book.chapters}</b> chương</span></p>
  <span class="tag">Sách</span>
</a>`;
}

function renderSoonCard(name) {
  return `<div class="card soon">
  <div class="card-cover"><span>${name}</span></div>
  <h3>${name}</h3>
  <p class="author">Kệ này sắp có</p>
  <span class="tag">Sắp có</span>
</div>`;
}

export function buildLibrary() {
  const books = readBooks(); // mới nhất đứng đầu
  const cards = [...books.map(renderBookCard), ...SOON_SHELVES.map(renderSoonCard)].join("\n");

  const template = readText(path.join(ROOT_DIR, "templates", "library.html"));
  const html = fillTemplate(template, {
    nav: renderNav("library", "../"),
    footer: renderFooter("../"),
    book_count: books.length,
    cards,
  });

  fs.mkdirSync(BOOKS_DIR, { recursive: true });
  writeText(path.join(BOOKS_DIR, "index.html"), html);
  console.log(`Đã tạo books/index.html (${books.length} cuốn)`);
}
