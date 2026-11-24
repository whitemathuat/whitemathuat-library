// Phép thử tạm thời trong lúc chuyển từ Python sang JS. Chạy: npm run compare
// Cho bản Python và bản JS cùng tạo trang, rồi so từng chữ: phải giống hệt.
// Có thêm 2 cuốn sách giả (ký tự đặc biệt, có/không có review) để thử chỗ khó.
// Sách giả được xóa khi xong. Sẽ bỏ file này khi đã xóa hết code Python.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT_DIR, NOVELS_DIR, listDirs } from "../tools/utils.js";
import { buildAll } from "../tools/build_all.js";

const PYTHON = "C:\\Users\\Admin\\AppData\\Local\\Programs\\Python\\Python315\\python.exe";
const FAKE_BOOKS = ["zz-thu-1", "zz-thu-2"];

// Sách giả 1: đủ loại ghi chú, tên chương lạ, review có link và ký tự đặc biệt
function makeFakeBooks() {
  const dir1 = path.join(NOVELS_DIR, FAKE_BOOKS[0]);
  fs.mkdirSync(dir1, { recursive: true });
  fs.writeFileSync(path.join(dir1, "notes.json"), JSON.stringify({
    title: `Sách "thử" & <b>Tom's</b>`,
    author: "Tác giả – Ẩn danh",
    sections: [
      { title: "Chương 1 – Mở đầu!", entries: [
        { type: "pair", highlight: "Câu <đẹp> & hay", note: "Ý 'mình'", location: 12 },
        { type: "highlight", text: "Chỉ highlight", location: 30 },
      ] },
      { title: "Chapter 2: The End??", entries: [
        { type: "note", text: "Chỉ ghi chú", location: 99 },
        { type: "other" },
      ] },
      { title: "Trống", entries: [] },
    ],
  }, null, 2));
  fs.writeFileSync(path.join(dir1, "review.md"),
    "# link: https://bi-tat.example | Bị tắt\r\n" +
    "link: https://a.example/?x=1&y=2 | Đọc ở đây\r\n" +
    "link: https://b.example\r\n" +
    "note_text: Ghi chú \"nhỏ\" <i>\r\n" +
    "rating: 8.5\r\n" +
    "---\r\n\r\nReview có <thẻ> & 'nháy'.\r\nDòng --- thứ hai.\r\n");
  fs.copyFileSync(path.join(NOVELS_DIR, "even-better", "cover.jpg"), path.join(dir1, "cover.jpg"));

  // Sách giả 2: không có review.md, thiếu tác giả
  const dir2 = path.join(NOVELS_DIR, FAKE_BOOKS[1]);
  fs.mkdirSync(dir2, { recursive: true });
  fs.writeFileSync(path.join(dir2, "notes.json"), JSON.stringify({ title: "Không review", sections: [] }));
}

// Đọc mọi trang đã tạo. Bỏ qua 2 thứ vô hình không ảnh hưởng trang:
// kiểu xuống dòng (\r\n / \n) và dấu cách thừa ở cuối dòng.
function readPages() {
  const files = ["index.html", "books/index.html", ...listDirs(NOVELS_DIR).map((s) => `novels/${s}/index.html`)];
  const pages = {};
  for (const f of files) {
    const full = path.join(ROOT_DIR, f);
    pages[f] = fs.existsSync(full)
      ? fs.readFileSync(full, "utf-8").replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "")
      : null;
  }
  return pages;
}

// Chỉ ra chỗ khác đầu tiên giữa 2 đoạn chữ
function firstDiff(a, b) {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return `ở ký tự ${i}:\n   Python: ${JSON.stringify(a.slice(i, i + 60))}\n   JS:     ${JSON.stringify(b.slice(i, i + 60))}`;
}

let problems = 0;
try {
  makeFakeBooks();

  execFileSync(PYTHON, ["tools/build_all.py"], { cwd: ROOT_DIR, stdio: "ignore" });
  const fromPython = readPages();

  buildAll();
  const fromJs = readPages();

  for (const f of Object.keys(fromPython)) {
    if (fromPython[f] === null) { console.log(`✗ Python không tạo ra ${f}`); problems++; }
    else if (fromJs[f] === null) { console.log(`✗ JS không tạo ra ${f}`); problems++; }
    else if (fromPython[f] !== fromJs[f]) { console.log(`✗ ${f} khác nhau ${firstDiff(fromPython[f], fromJs[f])}`); problems++; }
    else console.log(`✓ ${f} giống hệt`);
  }
} finally {
  // Dọn sách giả, tạo lại trang thật như cũ
  for (const b of FAKE_BOOKS) fs.rmSync(path.join(NOVELS_DIR, b), { recursive: true, force: true });
  buildAll();
}

console.log(problems ? `CÓ ${problems} CHỖ KHÁC` : "PYTHON VÀ JS TẠO RA TRANG GIỐNG HỆT NHAU.");
process.exit(problems ? 1 : 0);
