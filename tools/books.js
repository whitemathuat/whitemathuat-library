// Đọc dữ liệu sách trong novels/: notes.json (ghi chú) + review.md (nhận xét).
import fs from "node:fs";
import path from "node:path";
import { NOVELS_DIR, readText, listDirs, countStats } from "./utils.js";
import { parseReviewText } from "../js/review.js";

// Ngày dạng dd/mm/yyyy
function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

// "dd/mm/yyyy" -> số để so sánh ngày nào mới hơn (yyyymmdd). Sai dạng thì 0.
function dateValue(text) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text ?? "");
  return m ? Number(m[3]) * 10000 + Number(m[2]) * 100 + Number(m[1]) : 0;
}

// Đọc review.md (cách đọc nằm ở js/review.js, dùng chung với trang "Sửa sách").
export function parseReview(bookDir) {
  const reviewFile = path.join(bookDir, "review.md");
  if (!fs.existsSync(reviewFile)) return null;

  const { meta, text } = parseReviewText(readText(reviewFile));

  // Ngày "Cập nhật": ưu tiên dòng "date: dd/mm/yyyy" trong review.md
  // (giữ nguyên khi chuyển máy). Không có thì lấy ngày sửa file.
  if (!("date" in meta)) meta.date = formatDate(fs.statSync(reviewFile).mtime);

  return { meta, text };
}

// Số chương của một cuốn: chương cha có chương con thì đếm từng chương con (khác tên),
// không có thì đếm là 1. Ví dụ "Chính văn" (38 chương con) + "Ngoại truyện" (3) = 41.
export function countChapters(data) {
  let total = 0;
  for (const section of data.sections ?? []) {
    const names = new Set((section.entries ?? []).map((e) => e.chapter).filter(Boolean));
    total += names.size || 1;
  }
  return total;
}

// Tất cả sách có notes.json, mới cập nhật nhất đứng đầu.
// Mỗi cuốn: slug (tên thư mục), title, author, highlights, notes, chapters, date, rating, data (cả notes.json).
export function readBooks() {
  const books = [];
  for (const slug of listDirs(NOVELS_DIR)) {
    const bookDir = path.join(NOVELS_DIR, slug);
    const notesFile = path.join(bookDir, "notes.json");
    if (!fs.existsSync(notesFile)) continue;
    let data;
    try {
      data = JSON.parse(readText(notesFile));
    } catch (e) {
      console.log(`Lỗi đọc ${notesFile}: ${e.message}`);
      continue;
    }
    const review = parseReview(bookDir);
    books.push({
      slug,
      title: data.title ?? "Unknown Title",
      author: data.author ?? "Unknown Author",
      ...countStats(data),
      chapters: countChapters(data),
      date: review?.meta.date ?? "",
      rating: review?.meta.rating ?? "",
      data,
    });
  }
  // Mới nhất trước; cùng ngày thì giữ thứ tự tên thư mục
  return books.sort((a, b) => dateValue(b.date) - dateValue(a.date));
}
