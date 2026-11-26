// Tạo trang "Cài đặt": templates/settings.html -> settings/index.html
// Phần chạy trên trình duyệt nằm ở js/settings.js + js/settings-page.js; ở đây chỉ ghép menu và chân trang.
import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR, readText, writeText, fillTemplate } from "./utils.js";
import { renderNav, renderFooter } from "./layout.js";

const SETTINGS_DIR = path.join(ROOT_DIR, "settings");

export function buildSettings() {
  const template = readText(path.join(ROOT_DIR, "templates", "settings.html"));
  const html = fillTemplate(template, {
    nav: renderNav("settings", "../"),
    footer: renderFooter("../"),
  });
  fs.mkdirSync(SETTINGS_DIR, { recursive: true });
  writeText(path.join(SETTINGS_DIR, "index.html"), html);
  console.log("Đã tạo settings/index.html");
}
