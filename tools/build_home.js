// Tạo trang chủ: templates/home.html -> index.html
// Trang chủ có: số sách/chương/highlight/ghi chú, link tới sách mới nhất, và "câu của hôm nay".
import path from "node:path";
import { ROOT_DIR, readText, writeText, fillTemplate, escape } from "./utils.js";
import { readBooks } from "./books.js";
import { icons, renderNav, renderFooter } from "./layout.js";

const bookPage = (book) => `novels/${book.slug}/index.html`;

// Các câu highlight có kèm ghi chú, không quá dài, để làm "câu của hôm nay".
// Lấy từ tất cả các sách, nên sách mới thêm / sách bị xóa tự vào / ra danh sách khi dựng lại trang.
// (Trước đây có "câu ghim" cố định, DECISIONS 7; đã bỏ theo ý người dùng.)
export function quoteChoices(books) {
  const choices = [];
  for (const book of books) {
    for (const section of book.data.sections ?? []) {
      for (const entry of section.entries ?? []) {
        if (entry.type !== "pair") continue;
        if (entry.highlight.length < 25 || entry.highlight.length > 120) continue;
        choices.push({ text: entry.highlight, note: entry.note });
      }
    }
  }
  return choices;
}

// Chọn số thứ tự câu cho một ngày, ví dụ "2026-11-26".
// "Xáo" chữ ngày thành một con số (cách băm FNV-1a), nên các ngày liền nhau ra các câu
// cách xa nhau, trông như ngẫu nhiên; cùng một ngày thì luôn ra cùng một câu.
// Hàm này được chép nguyên vào trang chủ (trình duyệt chạy nó), và check_home.js cũng thử nó.
export function pickIndex(day, count) {
  var hash = 2166136261;
  for (var i = 0; i < day.length; i++) {
    hash ^= day.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash % count;
}

// Mỗi ngày hiện một câu khác (trình duyệt tự chọn theo ngày giờ Việt Nam).
// Trang tạo ra không đổi theo ngày, nên rebuild vẫn ra đúng trang cũ.
function quoteScript(choices) {
  // Đổi "<" để chữ trong câu không thể làm vỡ thẻ <script>
  const list = JSON.stringify(choices.map((c) => [c.text, c.note])).replace(/</g, "\\u003c");
  return `<script>
// Câu của hôm nay: cả ngày (giờ Việt Nam) một câu, ai mở cũng thấy cùng câu
(function () {
  var list = ${list};
  if (!list.length) return;
  ${pickIndex.toString()}
  // Ngày hôm nay theo giờ Việt Nam (UTC+7), dạng "2026-11-26"
  var day = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  var pick = list[pickIndex(day, list.length)];
  document.getElementById("quote-text").textContent = pick[0];
  document.getElementById("quote-note").textContent = pick[1];
})();
</script>`;
}

export function buildHome() {
  const books = readBooks(); // mới nhất đứng đầu
  const sum = (key) => books.reduce((total, book) => total + book[key], 0);

  const choices = quoteChoices(books);
  // Câu hiện sẵn trong trang (khi trình duyệt tắt JavaScript); bình thường script đổi ngay
  const first = choices[0] ?? { text: "Chưa có câu nào.", note: "white đọc gây" };

  const template = readText(path.join(ROOT_DIR, "templates", "home.html"));
  const html = fillTemplate(template, {
    nav: renderNav("home", ""),
    footer: renderFooter(""),
    latest_page: books.length ? bookPage(books[0]) : "books/index.html",
    book_count: books.length,
    chapter_count: sum("chapters"),
    highlight_count: sum("highlights"),
    note_count: sum("notes"),
    quote_text: escape(first.text),
    quote_note: escape(first.note),
    quote_script: quoteScript(choices),
    icon_arrow: icons.arrow,
    icon_book: icons.book,
    icon_mountain: icons.mountain,
    icon_pen: icons.pen,
  });

  writeText(path.join(ROOT_DIR, "index.html"), html);
  console.log(`Đã tạo index.html (${books.length} truyện)`);
}
