// Kiểm tra "câu của hôm nay" trên trang chủ (index.html):
// - danh sách câu trong trang khớp đúng với câu của các sách đang có (sách mới vào, sách xóa ra),
// - cùng một ngày luôn ra cùng một câu, các ngày khác nhau ra nhiều câu khác nhau,
// - đoạn chọn câu trong trang chạy được và chọn đúng câu của hôm nay.
// Trả về danh sách lỗi (rỗng = ổn). Được gọi từ check.js (sau khi đã tạo lại trang).
import path from "node:path";
import { ROOT_DIR, readText } from "./utils.js";
import { readBooks } from "./books.js";
import { quoteChoices, pickIndex } from "./build_home.js";

// Lấy danh sách câu nằm trong trang chủ ("var list = [...];")
function listInPage(html) {
  const match = html.match(/var list = (\[.*?\]);\n/s);
  return match ? JSON.parse(match[1]) : null;
}

// Chạy thử đoạn script của trang chủ với một trang giả, xem nó đặt câu nào.
function runPageScript(html, now) {
  const script = html.match(/<script>([\s\S]*?var list[\s\S]*?)<\/script>/)?.[1];
  if (!script) return null;
  const shown = {};
  const document = { getElementById: (id) => ({ set textContent(v) { shown[id] = v; } }) };
  const FakeDate = class extends Date {
    static now() { return now; }
  };
  new Function("document", "Date", script)(document, FakeDate);
  return shown;
}

export function checkHome() {
  const errors = [];
  const html = readText(path.join(ROOT_DIR, "index.html"));
  const expected = quoteChoices(readBooks()).map((c) => [c.text, c.note]);

  // 1. Danh sách câu trong trang = câu của các sách hiện có
  const list = listInPage(html);
  if (!list) return ["Trang chủ: không tìm thấy danh sách câu của hôm nay"];
  if (JSON.stringify(list) !== JSON.stringify(expected)) {
    errors.push(`Trang chủ: danh sách câu (${list.length}) không khớp với sách hiện có (${expected.length}), hãy chạy npm run build`);
  }
  if (!list.length) return errors;

  // 2. Cách chọn: cùng ngày cùng câu; 30 ngày liền phải ra nhiều câu khác nhau (trông ngẫu nhiên)
  if (pickIndex("2026-11-26", list.length) !== pickIndex("2026-11-26", list.length)) {
    errors.push("Trang chủ: cùng một ngày lại ra hai câu khác nhau");
  }
  const days = new Set();
  for (let d = 0; d < 30; d++) {
    const day = new Date(Date.UTC(2026, 0, 1 + d)).toISOString().slice(0, 10);
    days.add(pickIndex(day, list.length));
  }
  if (list.length >= 30 && days.size < 20) {
    errors.push(`Trang chủ: 30 ngày chỉ ra ${days.size} câu khác nhau, chưa đủ ngẫu nhiên`);
  }

  // 3. Script trong trang chạy được, theo giờ Việt Nam:
  //    18:00 UTC ngày 25/11 = 01:00 sáng 26/11 ở Việt Nam -> phải là câu của ngày 26/11
  try {
    const shown = runPageScript(html, Date.UTC(2026, 10, 25, 18, 0));
    const want = list[pickIndex("2026-11-26", list.length)];
    if (!shown || shown["quote-text"] !== want[0] || shown["quote-note"] !== want[1]) {
      errors.push("Trang chủ: script chọn câu không ra đúng câu của hôm nay (giờ Việt Nam)");
    }
  } catch (e) {
    errors.push(`Trang chủ: script chọn câu bị lỗi (${e.message})`);
  }
  return errors;
}
