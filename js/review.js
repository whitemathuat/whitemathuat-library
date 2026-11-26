// Đọc nội dung file review.md của một cuốn sách. Dùng chung cho:
// - tools/books.js (dựng trang trên máy / trên GitHub),
// - js/add-book.js (trang "Sửa sách" điền sẵn review cũ).
//
// Mẫu file: phần đầu (trước dòng ---) là thông tin "khóa: giá trị", phần sau là bài review.
//   link: https://... | Chính văn      (có thể nhiều dòng link; không có chữ thì hiện "Nguồn")
//   note_text: ghi chú ngắn
//   rating: 9.5
//   added: 20/11/2026                 (ngày thêm sách, không đổi khi sửa)
//   date: 26/11/2026                  (ngày cập nhật)
//   ---
//   bài review...
//
// Trả về { meta: { links: [{url, text}], rating?, note_text?, date?, ... }, text }.
export function parseReviewText(content) {
  const meta = { links: [] };
  let text = String(content ?? "");

  const cut = text.indexOf("---");
  if (cut !== -1) {
    const metaText = text.slice(0, cut);
    text = text.slice(cut + 3);
    for (const line of metaText.trim().split("\n")) {
      const colon = line.indexOf(":");
      if (colon === -1) continue;
      const key = line.slice(0, colon).trim();
      const value = line.slice(colon + 1).trim();

      if (key === "link") {
        const bar = value.indexOf("|");
        const url = bar === -1 ? value : value.slice(0, bar).trim();
        const linkText = bar === -1 ? "Nguồn" : value.slice(bar + 1).trim();
        meta.links.push({ url, text: linkText });
      } else {
        meta[key] = value;
      }
    }
  }

  return { meta, text: text.trim() };
}
