// Tạo lại toàn bộ trang web. Chạy: npm run build
import { pathToFileURL } from "node:url";
import { buildHome } from "./build_home.js";
import { buildLibrary } from "./build_library.js";
import { buildDetail } from "./build_detail.js";

export function buildAll() {
  console.log("--- Trang chủ ---");
  buildHome();
  console.log("--- Thư viện ---");
  buildLibrary();
  console.log("--- Trang từng cuốn sách ---");
  buildDetail();
}

// Chỉ tự chạy khi gọi thẳng file này (không chạy khi file khác import nó)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildAll();
  console.log("Xong! Mở lại trang (F5) để xem.");
}
