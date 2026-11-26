// Tạo trang "Thêm sách": templates/add.html -> books/add.html
// Phần chạy trên trình duyệt nằm ở js/add-book.js. Ở đây chỉ ghép menu, chân trang
// và danh sách sách đã có (để trang báo khi thêm trùng).
import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR, readText, writeText, fillTemplate } from "./utils.js";
import { readBooks } from "./books.js";
import { renderNav, renderFooter } from "./layout.js";

const BOOKS_DIR = path.join(ROOT_DIR, "books");

export function buildAdd() {
  // Xếp theo tên thư mục để trang không đổi khi chỉ đổi ngày cập nhật
  const existing = readBooks()
    .map((b) => ({ slug: b.slug, title: b.title }))
    .sort((a, b) => (a.slug < b.slug ? -1 : 1));
  // "<" đổi thành < để tên sách không thể đóng thẻ <script> sớm
  const existingJson = JSON.stringify(existing).replace(/</g, "\\u003c");

  const template = readText(path.join(ROOT_DIR, "templates", "add.html"));
  const html = fillTemplate(template, {
    nav: renderNav("", "../"),
    footer: renderFooter("../"),
    existing_books: existingJson,
  });

  fs.mkdirSync(BOOKS_DIR, { recursive: true });
  writeText(path.join(BOOKS_DIR, "add.html"), html);
  console.log("Đã tạo books/add.html");
}
