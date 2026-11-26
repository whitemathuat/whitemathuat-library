// Kiểm tra nút xếp sách "Mới thêm" / "A → Z" ở trang thư viện (books/index.html).
// Trả về danh sách lỗi (rỗng = ổn). Được gọi từ check.js, sau khi đã dựng lại trang.
import path from "node:path";
import { ROOT_DIR, readText } from "./utils.js";
import { readBooks, sortNewest, sortByTitle } from "./books.js";

export function checkLibrary() {
  const errors = [];
  const expect = (name, got, want) => {
    if (got !== want) errors.push(`Xếp sách, "${name}": ra ${got}, cần ${want}`);
  };
  const slugs = (list) => list.map((b) => b.slug).join(",");

  // 1. Cách xếp, với sách giả
  const fake = [
    { slug: "d", title: "Dế mèn", added: "01/01/2026" },
    { slug: "dd", title: "Đại dương", added: "05/03/2026" },
    { slug: "a", title: "anh", added: "05/03/2026" },
    { slug: "z", title: "Zebra", added: "28/12/2025" },
  ];
  expect("Mới thêm (cùng ngày thì theo tên)", slugs(sortNewest(fake)), "a,dd,d,z");
  expect("A → Z (D trước Đ, không phân biệt hoa thường)", slugs(sortByTitle(fake)), "a,d,dd,z");

  // 2. Mỗi cuốn thật đều có ngày thêm sách đúng dạng trong review.md
  const books = readBooks();
  for (const b of books) {
    const review = readText(path.join(ROOT_DIR, "novels", b.slug, "review.md"));
    if (!/^added:\s*\d{1,2}\/\d{1,2}\/\d{4}\s*$/m.test(review.split("---")[0])) {
      errors.push(`novels/${b.slug}/review.md thiếu dòng "added: dd/mm/yyyy" (ngày thêm sách)`);
    }
  }

  // 3. Trang đã dựng: thẻ xếp sẵn theo "Mới thêm", số data-az đúng thứ tự tên, có 2 nút và script
  const html = readText(path.join(ROOT_DIR, "books", "index.html"));
  const cards = [...html.matchAll(/<a class="card" data-new="(\d+)" data-az="(\d+)" href="\.\.\/novels\/([^/]+)\//g)]
    .map((m) => ({ new: Number(m[1]), az: Number(m[2]), slug: m[3] }));
  expect("số thẻ sách", cards.length, books.length);
  expect("thứ tự thẻ trên trang = Mới thêm", slugs(cards), slugs(sortNewest(books)));
  expect("data-new theo đúng thứ tự", cards.every((c, i) => c.new === i), true);
  const byAz = [...cards].sort((x, y) => x.az - y.az);
  expect("data-az = A → Z", slugs(byAz), slugs(sortByTitle(books)));
  expect("nút Mới thêm", html.includes('data-sort="new"'), true);
  expect("nút A → Z", html.includes('data-sort="az"'), true);
  expect("có script xếp sách", html.includes('src="../js/library-sort.js"'), true);
  expect("kệ Sắp có nằm sau sách", html.lastIndexOf('class="card" data-new') < html.indexOf('class="card soon"'), true);

  return errors;
}
