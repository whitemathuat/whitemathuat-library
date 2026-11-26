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
// Chương có chương con thì mỗi chương con tính là một chương (giống countChapters
// trong tools/books.js), nên danh sách "chapters" liệt kê từng chương con.
export function bookStats(data) {
  let highlights = 0;
  let notes = 0;
  const chapters = [];
  for (const section of data.sections ?? []) {
    const groups = new Map(); // tên chương con (hoặc "" nếu không có) -> số đếm
    for (const entry of section.entries ?? []) {
      const key = entry.chapter ?? "";
      if (!groups.has(key)) groups.set(key, { h: 0, n: 0 });
      const g = groups.get(key);
      if (entry.type === "pair") (g.h++, g.n++);
      else if (entry.type === "highlight") g.h++;
      else if (entry.type === "note") g.n++;
    }
    if (groups.size === 0) groups.set("", { h: 0, n: 0 }); // chương trống vẫn là 1 chương
    for (const [sub, g] of groups) {
      highlights += g.h;
      notes += g.n;
      // Tên chương con chỉ là số (vd "4") thì ghi kèm tên chương cha cho dễ hiểu
      const title = !sub ? section.title : /^\d+$/.test(sub) ? `${section.title} · ${sub}` : sub;
      chapters.push({ title, highlights: g.h, notes: g.n });
    }
  }
  return { chapters, highlights, notes };
}

// Sách đã có trong thư viện trùng tên thư mục hoặc trùng tên sách (không phân biệt hoa thường).
export function findExisting(existing, slug, title) {
  const t = String(title ?? "").trim().toLowerCase();
  return existing.find((b) => b.slug === slug || (t && b.title.trim().toLowerCase() === t)) ?? null;
}

// ---------- Link, điểm, review (giống luật của functions/api/save-book.js) ----------
export const MAX_REVIEW_CHARS = 50000;
export const isValidUrl = (url) => /^https?:\/\/\S+$/.test(url);
export const isValidRating = (r) => r === "" || (/^(10|[0-9])(\.[0-9])?$/.test(r) && Number(r) <= 10);

// Dọn những gì người dùng gõ: bỏ dòng link trống, bỏ khoảng trắng thừa,
// điểm "8,5" (dấu phẩy kiểu Việt) -> "8.5".
export function cleanReview({ links = [], rating = "", note_text = "", text = "" }) {
  return {
    links: links
      .map((l) => ({ url: String(l.url ?? "").trim(), text: String(l.text ?? "").trim() }))
      .filter((l) => l.url || l.text),
    rating: String(rating).trim().replace(",", "."),
    note_text: String(note_text).trim(),
    text: String(text).trim(),
  };
}

// Phần review còn sai gì? Trả về lời nhắc, hoặc "" nếu ổn. Nhận review đã qua cleanReview.
export function reviewProblem(review) {
  for (const link of review.links) {
    if (!link.url) return `Link “${link.text}” chưa có địa chỉ.`;
    if (!isValidUrl(link.url)) return `Địa chỉ link phải bắt đầu bằng https:// (đang là: ${link.url}).`;
  }
  if (!isValidRating(review.rating)) return "Điểm phải là số từ 0 đến 10 (ví dụ 8 hoặc 8.5).";
  if (review.text.length > MAX_REVIEW_CHARS) return "Bài review quá dài.";
  return "";
}

// Dữ liệu gửi lên /api/save-book. Review trống vẫn gửi: máy chủ tạo review.md có ngày hôm nay,
// để sách mới (hoặc sách vừa sửa) đứng đầu thư viện.
// Khi sửa sách: notebook / coverBase64 để trống (undefined) = giữ file cũ, không gửi.
export function buildPayload({ slug, notebook, coverBase64, review = {} }) {
  const payload = { slug };
  if (notebook != null) payload.notebook = notebook;
  if (coverBase64 != null) payload.cover = coverBase64;
  payload.review = cleanReview(review);
  return payload;
}

// ---------- Sửa sách đã có (trang add.html?sua=ten-thu-muc) ----------
// Tên thư mục sách cần sửa, lấy từ địa chỉ trang. Không có hoặc sai luật -> "".
export function editSlugFromSearch(search) {
  const slug = new URLSearchParams(search).get("sua") ?? "";
  return isValidSlug(slug) ? slug : "";
}

// review.md đã đọc (js/review.js) -> giá trị cho các ô nhập, đã dọn như cleanReview.
export const reviewToForm = (review) =>
  cleanReview({
    links: review?.meta.links ?? [],
    rating: review?.meta.rating ?? "",
    note_text: review?.meta.note_text ?? "",
    text: review?.text ?? "",
  });

// Hai bản review (đã dọn) có giống hệt nhau không
export const sameReview = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// File Kindle mới có đúng là của cuốn đang sửa không (so tên sách, không phân biệt hoa thường)
export const sameTitle = (a, b) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

// ---------- Khung căn ảnh bìa (chỉ tính toán; phần kéo/chạm nằm ở js/cover-crop.js) ----------
// Khung tính theo cỡ ảnh lưu ra: 600 x 900 (tỉ lệ 2:3 như bìa ở trang sách).
// view = { scale, x, y }: ảnh gốc phóng "scale" lần, góc trên trái của ảnh nằm ở (x, y) trong khung.
export const CROP_W = 600;
export const CROP_H = 900;
export const MAX_ZOOM = 4; // phóng to tối đa 4 lần so với lúc vừa khung

// Cỡ nhỏ nhất mà ảnh vẫn phủ kín khung
export const minScale = (img) => Math.max(CROP_W / img.w, CROP_H / img.h);

// Giữ ảnh luôn phủ kín khung (không lộ chỗ trống) và không phóng quá tay.
export function clampView(img, view) {
  const min = minScale(img);
  const scale = Math.min(Math.max(view.scale, min), min * MAX_ZOOM);
  const x = Math.min(0, Math.max(CROP_W - img.w * scale, view.x));
  const y = Math.min(0, Math.max(CROP_H - img.h * scale, view.y));
  return { scale, x, y };
}

// Lúc mới chọn ảnh: vừa khung, nằm giữa
export function startView(img) {
  const scale = minScale(img);
  return clampView(img, { scale, x: (CROP_W - img.w * scale) / 2, y: (CROP_H - img.h * scale) / 2 });
}

// Phóng to/nhỏ mà điểm (cx, cy) trong khung đứng yên (mặc định: giữa khung)
export function zoomView(img, view, scale, cx = CROP_W / 2, cy = CROP_H / 2) {
  const px = (cx - view.x) / view.scale; // điểm đó nằm ở đâu trên ảnh gốc
  const py = (cy - view.y) / view.scale;
  const next = clampView(img, { ...view, scale });
  return clampView(img, { scale: next.scale, x: cx - px * next.scale, y: cy - py * next.scale });
}

// Kéo ảnh đi (dx, dy) đơn vị khung
export const moveView = (img, view, dx, dy) => clampView(img, { ...view, x: view.x + dx, y: view.y + dy });

// Phần ảnh gốc nằm trong khung (để vẽ ra ảnh 600 x 900)
export const cropRect = (view) => ({ sx: -view.x / view.scale, sy: -view.y / view.scale, sw: CROP_W / view.scale, sh: CROP_H / view.scale });

// Số byte thật của một chuỗi base64 (để so với giới hạn 300 KB của ảnh bìa).
export function base64Bytes(b64) {
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return (b64.length * 3) / 4 - pad;
}
