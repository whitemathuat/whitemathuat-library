// Tạo trang chủ: templates/home.html -> index.html
// Trang chủ có: số sách/chương/highlight/ghi chú, bìa 2 cuốn mới nhất, và "câu của hôm nay".
import path from "node:path";
import { ROOT_DIR, readText, writeText, fillTemplate, escape } from "./utils.js";
import { readBooks } from "./books.js";
import { icons, renderNav, renderFooter } from "./layout.js";

const bookPage = (book) => `novels/${book.slug}/index.html`;

// Câu trích được ghim: luôn hiện câu này trên trang chủ.
// Muốn quay lại kiểu "mỗi ngày một câu" thì đặt PINNED_QUOTE = null.
const PINNED_QUOTE = { book: "unknown_lover_test", highlight: "32: Don’t Make Me Beg" };

// Tìm câu được ghim trong notes.json của cuốn sách đó (không thấy thì trả về null).
function pinnedQuote(books) {
  if (!PINNED_QUOTE) return null;
  const book = books.find((b) => b.slug === PINNED_QUOTE.book);
  for (const section of book?.data.sections ?? []) {
    for (const entry of section.entries ?? []) {
      if (entry.type === "pair" && entry.highlight === PINNED_QUOTE.highlight) {
        return { text: entry.highlight, note: entry.note };
      }
    }
  }
  return null;
}

// Các câu highlight có kèm ghi chú, không quá dài, để làm "câu của hôm nay".
function quoteChoices(books) {
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

// Mỗi ngày hiện một câu khác (trình duyệt tự chọn theo ngày).
// Trang tạo ra không đổi theo ngày, nên rebuild vẫn ra đúng trang cũ.
function quoteScript(choices) {
  // Đổi "<" để chữ trong câu không thể làm vỡ thẻ <script>
  const list = JSON.stringify(choices.map((c) => [c.text, c.note])).replace(/</g, "\\u003c");
  return `<script>
// Câu của hôm nay: số ngày kể từ 1/1/1970 chia lấy dư cho số câu
(function () {
  var list = ${list};
  if (!list.length) return;
  var pick = list[Math.floor(Date.now() / 86400000) % list.length];
  document.getElementById("quote-text").textContent = pick[0];
  document.getElementById("quote-note").textContent = pick[1];
})();
</script>`;
}

export function buildHome() {
  const books = readBooks(); // mới nhất đứng đầu
  const sum = (key) => books.reduce((total, book) => total + book[key], 0);

  const pinned = pinnedQuote(books);
  const choices = pinned ? [pinned] : quoteChoices(books);
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
