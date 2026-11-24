// Đọc file Kindle xuất ra (novels/<sách>/notebook.html) -> novels/<sách>/notes.json
// Chạy: npm run parse   (sau đó npm run build để tạo lại trang)
// Không cần thư viện thêm: file Kindle rất đều (mỗi mục là một <div class="...">),
// nên chỉ cần tìm các thẻ <div> đó bằng mẫu tìm kiếm.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { NOVELS_DIR, listDirs, readText, writeText } from "./utils.js";

// Highlight và Note cách nhau tối đa 3 "Location" thì ghép thành một cặp.
const PAIR_DISTANCE = 3;

// Đổi các ký hiệu đặc biệt của HTML (&amp; &#39; ...) về chữ thường.
function decodeEntities(text) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, code) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return String.fromCodePoint(n);
    }
    return named[code.toLowerCase()] ?? match;
  });
}

// Lấy chữ trong một thẻ: bỏ các thẻ con (như <span>), cắt khoảng trắng ở đầu/cuối
// từng đoạn chữ rồi nối lại bằng `separator` (giống cách bản Python cũ làm).
function getText(innerHtml, separator) {
  return innerHtml
    .split(/<[^>]*>/)
    .map((piece) => decodeEntities(piece).trim())
    .filter((piece) => piece !== "")
    .join(separator);
}

// Ghép các highlight/ghi chú của một chương thành danh sách mục.
// Highlight có ghi chú ngay sau (gần nhau) -> một mục "pair".
function buildEntries(events) {
  const entries = [];
  for (let j = 0; j < events.length; j++) {
    const event = events[j];
    const next = events[j + 1];
    if (event.type === "highlight") {
      const gap = next ? next.location - event.location : -1;
      if (next && next.type === "note" && gap >= 0 && gap <= PAIR_DISTANCE) {
        entries.push({ type: "pair", highlight: event.text, note: next.text, color: event.color, location: event.location });
        j++; // bỏ qua ghi chú vừa ghép
      } else {
        entries.push({ type: "highlight", text: event.text, color: event.color, location: event.location });
      }
    } else {
      entries.push({ type: "note", text: event.text, location: event.location });
    }
  }
  return entries;
}

// Đọc nội dung một file notebook.html -> dữ liệu { title, author, sections }.
export function parseNotebook(html) {
  // Tên sách và tác giả
  const firstText = (cls) => {
    const m = html.match(new RegExp(`<div class="${cls}"[^>]*>([\\s\\S]*?)</div>`));
    if (!m) throw new Error(`không tìm thấy mục "${cls}"`);
    return getText(m[1], "");
  };
  const title = firstText("bookTitle");
  const author = firstText("authors");

  // Mọi tên chương, dòng tiêu đề ghi chú, nội dung ghi chú, theo đúng thứ tự trong file
  const nodes = [...html.matchAll(/<div class="(sectionHeading|noteHeading|noteText)"[^>]*>([\s\S]*?)<\/div>/g)].map(
    (m) => ({ kind: m[1], inner: m[2] })
  );

  const sections = [];
  let section = null; // chương đang đọc
  let events = []; // highlight/ghi chú của chương đó

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    // Gặp tên chương mới: cất chương cũ, mở chương mới
    if (node.kind === "sectionHeading") {
      if (section) sections.push({ ...section, entries: buildEntries(events) });
      section = { title: getText(node.inner, "") };
      events = [];
      continue;
    }

    // Dòng tiêu đề kiểu "Highlight(yellow) - Page 14 · Location 89", nội dung nằm ở thẻ ngay sau
    if (node.kind === "noteHeading") {
      if (i + 1 >= nodes.length) break;
      const heading = getText(node.inner, " ");
      const text = getText(nodes[i + 1].inner, " ");
      i++; // thẻ nội dung đã dùng

      const locationMatch = heading.match(/Location\s+(\d+)/);
      if (!locationMatch) continue;
      const location = parseInt(locationMatch[1], 10);

      if (heading.startsWith("Highlight")) {
        const colorMatch = heading.match(/\((.*?)\)/);
        events.push({ type: "highlight", text, color: colorMatch ? colorMatch[1] : "yellow", location });
      } else {
        events.push({ type: "note", text, location });
      }
    }
  }

  // Cất chương cuối cùng
  if (section) sections.push({ ...section, entries: buildEntries(events) });

  return { title, author, sections };
}

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
