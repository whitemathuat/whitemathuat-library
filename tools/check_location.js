// Kiểm tra nút "Ẩn vị trí" / "Hiện vị trí" trên trang từng cuốn sách (js/show-location.js).
// Trả về danh sách lỗi (rỗng = ổn). Được gọi từ check.js, sau khi đã dựng lại trang.
import path from "node:path";
import { ROOT_DIR, NOVELS_DIR, readText } from "./utils.js";
import { readBooks } from "./books.js";

export function checkLocation() {
  const errors = [];
  // CSS phải có luật ẩn dòng vị trí khi khung ghi chú có class "hide-loc"
  if (!readText(path.join(ROOT_DIR, "css", "detail.css")).includes(".hide-loc .loc")) {
    errors.push('css/detail.css thiếu luật ".hide-loc .loc" (ẩn vị trí)');
  }
  // Mỗi trang sách: có nút, có script, và mỗi ghi chú có dòng vị trí
  for (const b of readBooks()) {
    const html = readText(path.join(NOVELS_DIR, b.slug, "index.html"));
    const name = `novels/${b.slug}/index.html`;
    if (!html.includes('id="loc-toggle"')) errors.push(`${name}: thiếu nút "Ẩn vị trí"`);
    if (!html.includes('src="../../js/show-location.js"')) errors.push(`${name}: thiếu js/show-location.js`);
    const notes = (html.match(/<article class="note">/g) || []).length;
    const locs = (html.match(/<span class="loc">/g) || []).length;
    if (notes !== locs) errors.push(`${name}: ${notes} ghi chú nhưng ${locs} dòng vị trí`);
  }
  return errors;
}
