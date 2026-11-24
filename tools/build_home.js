// Tạo trang chủ: templates/home.html -> index.html (có số lượng sách).
import path from "node:path";
import { ROOT_DIR, NOVELS_DIR, readText, writeText, listDirs, fillTemplate } from "./utils.js";

export function buildHome() {
  // 1. Đếm số sách = số thư mục con trong novels/
  const bookCount = listDirs(NOVELS_DIR).length;

  // 2. Đọc khuôn và đổ số sách vào
  const template = readText(path.join(ROOT_DIR, "templates", "home.html"));
  const html = fillTemplate(template, { book_count: bookCount });

  // 3. Ghi ra index.html ở thư mục gốc
  writeText(path.join(ROOT_DIR, "index.html"), html);
  console.log(`Đã tạo index.html (${bookCount} truyện)`);
}
