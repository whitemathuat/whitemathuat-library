// Kiểm tra việc ẩn/hiện vị trí highlight trên trang từng cuốn sách (js/show-location.js),
// điều khiển bởi cài đặt chung "Hiện vị trí highlight" (trang Cài đặt, settings.json).
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
  // Mỗi trang sách: có 2 script (settings.js trước), KHÔNG còn nút "Ẩn vị trí" cũ, mỗi ghi chú có dòng vị trí
  for (const b of readBooks()) {
    const html = readText(path.join(NOVELS_DIR, b.slug, "index.html"));
    const name = `novels/${b.slug}/index.html`;
    if (html.includes('id="loc-toggle"')) errors.push(`${name}: vẫn còn nút "Ẩn vị trí" cũ`);
    const settingsAt = html.indexOf('src="../../js/settings.js"');
    const locationAt = html.indexOf('src="../../js/show-location.js"');
    if (settingsAt < 0 || locationAt < 0 || settingsAt > locationAt) {
      errors.push(`${name}: cần js/settings.js rồi tới js/show-location.js`);
    }
    const notes = (html.match(/<article class="note">/g) || []).length;
    const locs = (html.match(/<span class="loc">/g) || []).length;
    if (notes !== locs) errors.push(`${name}: ${notes} ghi chú nhưng ${locs} dòng vị trí`);
  }
  return errors;
}
