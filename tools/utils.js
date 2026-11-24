// Các hàm dùng chung cho mọi trang.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Thư mục gốc của dự án (thư mục cha của tools/)
export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const NOVELS_DIR = path.join(ROOT_DIR, "novels");

// Đọc file chữ. Đổi xuống dòng kiểu Windows (\r\n) thành \n cho thống nhất.
export function readText(file) {
  return fs.readFileSync(file, "utf-8").replace(/\r\n/g, "\n");
}

// Ghi file chữ (UTF-8, xuống dòng kiểu \n).
export function writeText(file, text) {
  fs.writeFileSync(file, text, "utf-8");
}

// Danh sách thư mục con (đã xếp theo tên), ví dụ các cuốn sách trong novels/.
export function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0));
}

// Đổ dữ liệu vào khuôn: "{ten}" trong khuôn được thay bằng values.ten.
// "{{" và "}}" là dấu ngoặc thật (giống cách Python làm trước đây).
export function fillTemplate(template, values) {
  return template.replace(/\{\{|\}\}|\{(\w+)\}/g, (match, name) => {
    if (match === "{{") return "{";
    if (match === "}}") return "}";
    if (!(name in values)) throw new Error(`Khuôn cần "{${name}}" nhưng không có dữ liệu`);
    return String(values[name]);
  });
}

// Đổi ký tự đặc biệt (< > & " ') để chữ hiện đúng, không làm vỡ trang.
export function escape(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Đếm số highlight và số ghi chú của một cuốn sách.
export function countStats(data) {
  let highlights = 0;
  let notes = 0;
  for (const section of data.sections ?? []) {
    for (const entry of section.entries ?? []) {
      if (entry.type === "pair") {
        highlights += 1;
        notes += 1;
      } else if (entry.type === "highlight") {
        highlights += 1;
      } else if (entry.type === "note") {
        notes += 1;
      }
    }
  }
  return { highlights, notes };
}
