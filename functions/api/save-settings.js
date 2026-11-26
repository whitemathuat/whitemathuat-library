// Chức năng "Lưu cài đặt" của trang Cài đặt (settings/index.html): ghi file settings.json
// lên GitHub thành MỘT lần lưu (commit), giống nút "Lưu sách" (dùng chung chìa khóa GITHUB_TOKEN).
// Cloudflare tự đưa bản mới lên mạng sau 1–2 phút; mọi trang sách đọc settings.json khi mở.
//
//   POST /api/save-settings  -> gửi JSON: { show_location: true }
//     (đủ mọi cài đặt; cài đặt lạ hoặc sai kiểu bị từ chối)

import { UserError, json, branchForHost, commitFiles, readJsonBody } from "./save-book.js";

// Các cài đặt được phép và kiểu của chúng. Thêm cài đặt mới: thêm một dòng ở đây
// (và giá trị mặc định trong js/settings.js + settings.json).
const ALLOWED = {
  show_location: "boolean", // hiện dòng vị trí ("Loc 343") dưới mỗi ghi chú
};

// Kiểm tra dữ liệu gửi lên, trả về nội dung file settings.json.
export function makeSettingsJson(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new UserError("Dữ liệu gửi lên không đúng dạng");
  const settings = {};
  for (const [key, type] of Object.entries(ALLOWED)) {
    if (typeof body[key] !== type) throw new UserError(`Cài đặt “${key}” thiếu hoặc sai kiểu`);
    settings[key] = body[key];
  }
  for (const key of Object.keys(body)) {
    if (!(key in ALLOWED)) throw new UserError(`Không có cài đặt “${key}”`);
  }
  return `${JSON.stringify(settings, null, 2)}\n`;
}

// Phần chính, tách riêng để tools/check_settings.js thử được với GitHub giả.
export async function handleSettings(request, env, fetchFn = fetch) {
  try {
    const url = new URL(request.url);
    const branch = branchForHost(url.host);
    if (!branch) throw new UserError("Chỉ lưu được từ trang web chính hoặc bản thử dev", 403);
    if (!env.GITHUB_TOKEN) throw new UserError("Chưa đặt chìa khóa GITHUB_TOKEN trên Cloudflare", 503);
    if (request.method !== "POST") throw new UserError("Cách gọi không được hỗ trợ", 405);

    const body = await readJsonBody(request, url);
    const content = makeSettingsJson(body);
    const files = [{ path: "settings.json", content, encoding: "utf-8" }];
    const sha = await commitFiles(fetchFn, env.GITHUB_TOKEN, branch, "Website: save settings", files);
    return json({ ok: true, message: "Đã lưu, máy khác cập nhật sau 1–2 phút.", branch, commit: sha });
  } catch (e) {
    if (e instanceof UserError) return json({ ok: false, message: e.message }, e.status);
    return json({ ok: false, message: "Lỗi không mong đợi khi lưu" }, 500);
  }
}

export const onRequest = (context) => handleSettings(context.request, context.env);
