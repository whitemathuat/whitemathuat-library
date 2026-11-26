// Phần khung của kiểu giao diện 2a, dùng chung cho mọi trang: menu trên cùng, chân trang, biểu tượng.
// prefix = đường đi từ trang về thư mục gốc: "" (trang chủ), "../" (thư viện), "../../" (trang sách).
import { escape } from "./utils.js";

// Biểu tượng nét mảnh (vẽ bằng SVG, đổi màu theo chữ)
const svg = (paths) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
export const icons = {
  leaf: svg('<path d="M12 21V9M12 13c-3 0-5-2-6-5 3 0 5 1 6 4M12 10c2-3 4-4 7-4-1 3-3 5-7 5M12 16c3 0 5-1 6-4"/>'),
  book: svg('<path d="M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>'),
  mountain: svg('<path d="M2 19l7-11 4 6 2-3 7 8z"/>'),
  pen: svg('<path d="M4 20l4-1 11-11-3-3L5 16zM14 7l3 3"/>'),
  arrow: svg('<path d="M4 12h15M14 7l5 5-5 5"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/><circle cx="12" cy="12" r="6.5"/>'),
};

// Menu trên cùng. active = "home" | "library" | "settings" | "" (mục đang chọn được gạch chân).
// "Đang đọc" và "Yêu thích" chưa có trang nên hiện mờ.
// Bánh răng (trang Cài đặt) đi chung một khối với "Yêu thích" để lá vẫn nằm giữa menu.
export function renderNav(active, prefix) {
  const on = (name) => (active === name ? ' class="on"' : "");
  const gearClass = active === "settings" ? "gear on" : "gear";
  return `<header class="nav">
  <a href="${prefix}index.html"${on("home")}>Trang chủ</a>
  <a href="${prefix}books/index.html"${on("library")}>Thư viện</a>
  <a class="logo" href="${prefix}index.html" aria-label="white đọc gây">${icons.leaf}</a>
  <span class="soon" title="Sắp có">Đang đọc</span>
  <span class="nav-end"><span class="soon" title="Sắp có">Yêu thích</span><a class="${gearClass}" href="${prefix}settings/index.html" aria-label="Cài đặt" title="Cài đặt">${icons.gear}</a></span>
</header>`;
}

// Điểm chấm trong review.md ("rating: 8"). Không phải số thì ghi "chưa chấm".
export function renderRating(rating) {
  const score = Number(rating);
  if (rating === "" || !Number.isFinite(score)) return `<span class="rating none">chưa chấm</span>`;
  return `<span class="rating">★ ${escape(rating)} / 10</span>`;
}

export function renderFooter(prefix) {
  return `<footer class="foot">
  <div><b>white đọc gây</b><p>cả đời cống hiến cho nền gây học.</p></div>
  <nav><a href="${prefix}index.html">Trang chủ</a><a href="${prefix}books/index.html">Thư viện</a></nav>
</footer>`;
}
