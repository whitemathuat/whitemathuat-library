// Đọc file Kindle xuất ra (novels/<sách>/notebook.html) -> novels/<sách>/notes.json
// Chạy: npm run parse   (sau đó npm run build để tạo lại trang)
// Cách đọc nằm ở js/notebook.js (dùng chung với trang "Thêm sách").
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { NOVELS_DIR, listDirs, readText, writeText } from "./utils.js";
import { parseNotebook } from "../js/notebook.js";

export { parseNotebook };

// Đọc tất cả sách có notebook.html, ghi notes.json ngay trong thư mục sách đó.
export function parseAllBooks() {
  for (const book of listDirs(NOVELS_DIR)) {
    const notebook = path.join(NOVELS_DIR, book, "notebook.html");
    if (!fs.existsSync(notebook)) continue;
    const data = parseNotebook(readText(notebook));
    writeText(path.join(NOVELS_DIR, book, "notes.json"), JSON.stringify(data, null, 2));
    console.log(`Đã đọc ${book}`);
  }
}

// Chỉ tự chạy khi gọi thẳng file này
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  parseAllBooks();
  console.log("Xong! Chạy tiếp: npm run build");
}
