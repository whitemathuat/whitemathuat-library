// Lệnh kiểm tra toàn bộ web. Chạy: npm run check
// Làm 3 việc:
// 1. Tạo lại tất cả các trang (như npm run build) -> báo lỗi nếu code hỏng.
// 2. Mỗi cuốn sách trong novels/ phải có đủ notes.json (đọc được, khớp notebook.html), cover.jpg, index.html;
//    cover.jpg không quá nặng (nếu nặng: chạy npm run covers).
// 3. Mọi đường link trong các trang (href/src) và trong CSS (url(...)) phải trỏ tới
//    file có thật; link "#chuong-x" phải có mục tương ứng trên trang.
// 4. Cổng mật khẩu (functions/_middleware.js) chặn đúng và không bị lỗi 500 (tools/check_login.js).
// 5. Chức năng "Lưu sách" (functions/api/save-book.js) chặn dữ liệu sai và lưu đúng (tools/check_save.js).
// 6. Trang "Thêm sách" đặt tên thư mục đúng và gửi dữ liệu máy chủ nhận được (tools/check_add.js).
// Kết thúc bằng "TẤT CẢ ĐỀU ỔN" hoặc danh sách lỗi (mã thoát 1).
import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR, NOVELS_DIR, listDirs, readText } from "./utils.js";
import { buildAll } from "./build_all.js";
import { parseNotebook } from "./parse_notebook.js";
import { checkLogin } from "./check_login.js";
import { checkSave } from "./check_save.js";
import { checkAdd } from "./check_add.js";

const errors = [];
const MAX_COVER_KB = 300; // ảnh bìa nặng hơn mức này là chưa thu nhỏ

// Đường dẫn ngắn cho dễ đọc, ví dụ "novels/even-better/index.html"
const short = (file) => path.relative(ROOT_DIR, file).replace(/\\/g, "/");

// Lấy mọi chỗ khớp mẫu tìm kiếm (phần trong ngoặc đầu tiên)
const findAll = (text, pattern) => [...text.matchAll(pattern)].map((m) => m[1]);

// Bước 1: tạo lại trang, giấu bớt chữ in ra cho gọn.
function checkBuild() {
  const log = console.log;
  console.log = () => {};
  try {
    buildAll();
  } catch (e) {
    errors.push(`Tạo trang bị lỗi: ${e.message}`);
  } finally {
    console.log = log;
  }
}

// Bước 2: mỗi thư mục sách có đủ file cần thiết.
function checkBooks() {
  for (const book of listDirs(NOVELS_DIR)) {
    const dir = path.join(NOVELS_DIR, book);
    for (const name of ["notes.json", "cover.jpg", "index.html"]) {
      if (!fs.existsSync(path.join(dir, name))) errors.push(`Sách '${book}' thiếu file ${name}`);
    }
    // Ảnh bìa quá nặng làm trang mở chậm trên điện thoại -> nhắc chạy npm run covers
    const cover = path.join(dir, "cover.jpg");
    if (fs.existsSync(cover) && fs.statSync(cover).size > MAX_COVER_KB * 1024) {
      errors.push(`Sách '${book}': cover.jpg nặng hơn ${MAX_COVER_KB} KB, hãy chạy npm run covers`);
    }
    const notes = path.join(dir, "notes.json");
    if (fs.existsSync(notes)) {
      try {
        JSON.parse(readText(notes));
      } catch (e) {
        errors.push(`Sách '${book}': notes.json hỏng (${e.message})`);
      }
    }
    // notes.json phải khớp với file Kindle (notebook.html), nếu không là quên chạy npm run parse
    const notebook = path.join(dir, "notebook.html");
    if (fs.existsSync(notebook) && fs.existsSync(notes)) {
      try {
        const fresh = JSON.stringify(parseNotebook(readText(notebook)), null, 2);
        if (fresh !== readText(notes)) errors.push(`Sách '${book}': notes.json cũ, hãy chạy npm run parse`);
      } catch (e) {
        errors.push(`Sách '${book}': đọc notebook.html bị lỗi (${e.message})`);
      }
    }
  }
}

const isExternal = (link) => /^(https?:|mailto:|data:|\/\/)/.test(link);

// Link tới file khác: file đó phải tồn tại.
function checkFileLinks(file, links) {
  for (const link of links) {
    if (!link || link.startsWith("#") || isExternal(link)) continue;
    let linkPath = link.split("#")[0].split("?")[0];
    try {
      linkPath = decodeURIComponent(linkPath); // "%20" -> dấu cách
    } catch {
      // mã % viết sai: để nguyên, nếu file không có sẽ báo link hỏng
    }
    let target = path.resolve(path.dirname(file), linkPath);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
    if (!fs.existsSync(target)) errors.push(`${short(file)}: link hỏng -> ${link}`);
  }
}

// Bước 3a: link trong các trang HTML đã tạo.
function checkPages() {
  const pages = [path.join(ROOT_DIR, "index.html"), path.join(ROOT_DIR, "books", "index.html"), path.join(ROOT_DIR, "books", "add.html")];
  for (const book of listDirs(NOVELS_DIR)) {
    const page = path.join(NOVELS_DIR, book, "index.html");
    if (fs.existsSync(page)) pages.push(page);
  }
  for (const page of pages) {
    if (!fs.existsSync(page)) {
      errors.push(`Thiếu trang ${short(page)}`);
      continue;
    }
    const html = readText(page);
    checkFileLinks(page, findAll(html, /(?:href|src)="([^"]*)"/g));
    // Link nhảy tới chương (#ten-chuong) phải có id tương ứng
    const ids = new Set(findAll(html, /id="([^"]+)"/g));
    for (const anchor of findAll(html, /href="#([^"]+)"/g)) {
      if (!ids.has(anchor)) errors.push(`${short(page)}: không có mục #${anchor}`);
    }
  }
}

// Bước 3b: ảnh/phông chữ gọi trong CSS phải tồn tại.
function checkCss() {
  const cssDir = path.join(ROOT_DIR, "css");
  const files = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css")).sort();
  for (const f of files) {
    const file = path.join(cssDir, f);
    // Bỏ qua hình vẽ nhúng thẳng trong CSS (url("data:...")): bên trong có thể có url() của riêng nó
    const css = readText(file).replace(/url\(\s*(["'])data:.*?\1\s*\)/g, "");
    checkFileLinks(file, findAll(css, /url\(\s*["']?([^"')]+)["']?\s*\)/g));
    // File CSS gọi thêm file CSS khác: @import "ten.css"
    checkFileLinks(file, findAll(css, /@import\s+["']([^"']+)["']/g));
  }
}

checkBuild();
checkBooks();
checkPages();
checkCss();
errors.push(...(await checkLogin()));
errors.push(...(await checkSave()));
errors.push(...(await checkAdd()));

if (errors.length) {
  console.log(`CÓ ${errors.length} LỖI:`);
  for (const e of errors) console.log(" -", e);
  process.exit(1);
}
console.log("TẤT CẢ ĐỀU ỔN: tạo trang được, sách đủ file, không có link hỏng, cổng mật khẩu và chức năng lưu sách ổn.");
