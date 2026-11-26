// Các hàm nhỏ của trang "Thêm sách", không đụng tới trang web (không DOM),
// nên tools/check_add.js thử được bằng Node.

// Tên thư mục sách từ tên sách: bỏ dấu tiếng Việt, chữ thường, dấu cách -> "-".
// Ví dụ "Even Better" -> "even-better", "Đắc Nhân Tâm" -> "dac-nhan-tam".
export function slugify(title) {
  return String(title ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // bỏ dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // mọi ký tự khác -> gạch ngang
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

// Giống luật của functions/api/save-book.js
export const isValidSlug = (slug) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= 60;

// Đếm chương / highlight / ghi chú (giống countStats trong tools/utils.js).
export function bookStats(data) {
  let highlights = 0;
  let notes = 0;
  const chapters = (data.sections ?? []).map((section) => {
    let h = 0;
    let n = 0;
    for (const entry of section.entries ?? []) {
      if (entry.type === "pair") (h++, n++);
      else if (entry.type === "highlight") h++;
      else if (entry.type === "note") n++;
    }
    highlights += h;
    notes += n;
    return { title: section.title, highlights: h, notes: n };
  });
  return { chapters, highlights, notes };
}

// Sách đã có trong thư viện trùng tên thư mục hoặc trùng tên sách (không phân biệt hoa thường).
export function findExisting(existing, slug, title) {
  const t = String(title ?? "").trim().toLowerCase();
  return existing.find((b) => b.slug === slug || (t && b.title.trim().toLowerCase() === t)) ?? null;
}

// Dữ liệu gửi lên /api/save-book. review rỗng: máy chủ vẫn tạo review.md có ngày hôm nay,
// để sách mới đứng đầu thư viện (điểm, link, bài review: bước 3).
export function buildPayload({ slug, notebook, coverBase64 }) {
  return { slug, notebook, cover: coverBase64, review: {} };
}

// Số byte thật của một chuỗi base64 (để so với giới hạn 300 KB của ảnh bìa).
export function base64Bytes(b64) {
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return (b64.length * 3) / 4 - pad;
}
