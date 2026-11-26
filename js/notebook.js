// Đọc file Kindle xuất ra (notebook.html) -> dữ liệu { title, author, sections }.
// Dùng chung cho 2 nơi: máy dựng trang (tools/parse_notebook.js) và trang "Thêm sách"
// trên trình duyệt (js/add-book.js, để xem trước). Vì vậy file này không dùng gì của Node.
// File Kindle rất đều (mỗi mục là một <div class="...">), nên chỉ cần tìm các thẻ đó.

// Highlight và Note cách nhau tối đa 3 "Location" thì ghép thành một cặp.
// File chỉ ghi "Page" (không có Location): phải cùng trang mới ghép.
const PAIR_DISTANCE = 3;
const PAIR_DISTANCE_PAGE = 0;

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

// Tên chương con trong dòng tiêu đề, nếu sách có chương con.
// Ví dụ "Highlight(yellow) - 4 > Page 27 · Location 343" -> "4" (chương 4 nằm trong chương cha).
// Sách không có chương con ghi "Highlight(yellow) - Page 14 · Location 89" -> null.
function getSubchapter(heading) {
  const oneLine = heading.replace(/\s+/g, " "); // file Kindle có xuống dòng giữa tiêu đề
  const m = oneLine.match(/^.*? - (.+) > (?:Page|Location)\b/);
  return m ? m[1].trim() : null;
}

// Ghép các highlight/ghi chú của một chương thành danh sách mục.
// Highlight có ghi chú ngay sau (gần nhau) -> một mục "pair".
// Mục chỉ có "chapter" (tên chương con) khi file Kindle có ghi, để sách cũ giữ nguyên notes.json.
function buildEntries(events) {
  const entries = [];
  const withChapter = (entry, event) => (event.chapter ? { ...entry, chapter: event.chapter } : entry);
  // Vị trí lưu vào notes.json: "location" nếu file có, không thì "page"
  const where = (event) => (event.location != null ? { location: event.location } : { page: event.page });
  for (let j = 0; j < events.length; j++) {
    const event = events[j];
    const next = events[j + 1];
    if (event.type === "highlight") {
      let gap = -1;
      let maxGap = PAIR_DISTANCE;
      if (next && event.location != null && next.location != null) gap = next.location - event.location;
      else if (next && event.page != null && next.page != null) {
        gap = next.page - event.page;
        maxGap = PAIR_DISTANCE_PAGE;
      }
      if (next && next.type === "note" && gap >= 0 && gap <= maxGap) {
        entries.push(withChapter({ type: "pair", highlight: event.text, note: next.text, color: event.color, ...where(event) }, event));
        j++; // bỏ qua ghi chú vừa ghép
      } else {
        entries.push(withChapter({ type: "highlight", text: event.text, color: event.color, ...where(event) }, event));
      }
    } else {
      entries.push(withChapter({ type: "note", text: event.text, ...where(event) }, event));
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

      // Có file ghi "Page 7 · Location 89", có file (vd sách có số trang thật) chỉ ghi "Page 7"
      const locationMatch = heading.match(/Location\s+(\d+)/);
      const pageMatch = heading.match(/Page\s+(\d+)/);
      if (!locationMatch && !pageMatch) continue;
      const pos = locationMatch
        ? { location: parseInt(locationMatch[1], 10) }
        : { page: parseInt(pageMatch[1], 10) };
      const chapter = getSubchapter(heading);

      if (heading.startsWith("Highlight")) {
        const colorMatch = heading.match(/\((.*?)\)/);
        events.push({ type: "highlight", text, color: colorMatch ? colorMatch[1] : "yellow", ...pos, chapter });
      } else {
        events.push({ type: "note", text, ...pos, chapter });
      }
    }
  }

  // Cất chương cuối cùng
  if (section) sections.push({ ...section, entries: buildEntries(events) });

  return { title, author, sections };
}
