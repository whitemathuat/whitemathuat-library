// Kiểm tra phần đọc file Kindle (js/notebook.js) với 2 kiểu tiêu đề:
// - sách có chương con: "Highlight(yellow) - 4 > Page 27 · Location 343" -> chapter "4",
// - sách thường: "Highlight(yellow) - Page 14 · Location 89" -> không có chapter.
// Trả về danh sách lỗi (rỗng = ổn). Được gọi từ check.js.
import { parseNotebook } from "./parse_notebook.js";
import { countChapters } from "./books.js";

// Một file Kindle nhỏ giả lập, viết giống file thật (có xuống dòng giữa tiêu đề)
const SAMPLE = `<div class="bookTitle">Sách thử</div><div class="authors">Tác giả</div>
<div class="sectionHeading">Chính văn</div>
<div class="noteHeading">
  Highlight(<span class="annotation_yellow">yellow</span>)
  - 4 &gt; Page 27 · Location 343
</div><div class="noteText">Câu một</div>
<div class="noteHeading">
  Note - 4 &gt; Page 27 · Location 343
</div><div class="noteText">Ghi chú một</div>
<div class="noteHeading">
  Highlight(<span class="annotation_yellow">yellow</span>)
  - 18 &gt; Page 128 · Location 1654
</div><div class="noteText">Câu hai</div>
<div class="sectionHeading">Chương thường</div>
<div class="noteHeading">
  Highlight(<span class="annotation_yellow">yellow</span>)
  - Page 14 · Location 89
</div><div class="noteText">Câu ba</div>`;

export function checkNotebook() {
  const errors = [];
  const expect = (name, got, want) => {
    if (got !== want) errors.push(`Đọc file Kindle, "${name}": ra ${JSON.stringify(got)}, cần ${JSON.stringify(want)}`);
  };
  try {
    const [main, plain] = parseNotebook(SAMPLE).sections;
    expect("số mục chương 1", main.entries.length, 2);
    expect("chương con mục 1", main.entries[0].chapter, "4");
    expect("mục 1 là cặp highlight + ghi chú", main.entries[0].type, "pair");
    expect("chương con mục 2", main.entries[1].chapter, "18");
    expect("sách thường không có chương con", "chapter" in plain.entries[0], false);
    // 2 chương con (4, 18) + 1 chương thường = 3 chương
    expect("số chương đếm cả chương con", countChapters(parseNotebook(SAMPLE)), 3);
  } catch (e) {
    errors.push(`Đọc file Kindle bị lỗi: ${e.message}`);
  }
  return errors;
}
