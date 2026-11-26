// Kiểm tra trang Cài đặt và cài đặt chung (settings.json):
// 1. settings.json đọc được, đủ cài đặt, đúng kiểu.
// 2. Trang settings/index.html có công tắc "Hiện vị trí highlight" và 2 script; mọi trang có bánh răng ở menu.
// 3. js/settings.js chọn đúng: bản vừa bấm trên máy này thắng settings.json cũ trong 10 phút, sau đó settings.json thắng.
// 4. js/show-location.js ẩn/hiện vị trí đúng theo cài đặt (chạy với trang giả).
// 5. Chức năng "Lưu cài đặt" (functions/api/save-settings.js) với GitHub giả: chặn dữ liệu sai, lưu đúng một file.
// Trả về danh sách lỗi (rỗng = ổn). Được gọi từ check.js, sau khi đã dựng lại trang.
import path from "node:path";
import { ROOT_DIR, NOVELS_DIR, readText } from "./utils.js";
import { readBooks } from "./books.js";
import { fakeGithub } from "./check_save.js";
import { handleSettings } from "../functions/api/save-settings.js";

const MAIN = "https://whitemathuat-library.pages.dev/api/save-settings";
const DEV = "https://dev.whitemathuat-library.pages.dev/api/save-settings";

// Chạy js/settings.js (+ script thêm, nếu có) với một trình duyệt giả.
// store = localStorage giả; fetched = nội dung settings.json trả về (null = không tải được).
function runBrowser({ store = {}, fetched = null, extra = "", elements = {} } = {}) {
  const window = {};
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  const pending = [];
  const fetch = () => {
    const p = fetched ? Promise.resolve({ ok: true, json: async () => fetched }) : Promise.reject(new Error("offline"));
    pending.push(p.catch(() => {}));
    return p;
  };
  const document = { getElementById: (id) => elements[id] || null };
  const code = readText(path.join(ROOT_DIR, "js", "settings.js")) + "\n" + extra;
  new Function("window", "localStorage", "fetch", "document", code)(window, localStorage, fetch, document);
  // Chờ fetch + các bước .then xong
  const settle = () => new Promise((r) => setTimeout(r, 0));
  return { S: window.LibrarySettings, store, done: Promise.all(pending).then(settle).then(settle) };
}

// Khung ghi chú giả: nhớ class "hide-loc"
function fakePanel() {
  const classes = new Set();
  return { classes, classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) } };
}

async function post(body, { url = MAIN, env = { GITHUB_TOKEN: "token-thu" }, headers = {}, method = "POST" } = {}) {
  const github = fakeGithub();
  const request = new Request(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: method === "POST" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });
  const res = await handleSettings(request, env, github.fetchFn);
  return { status: res.status, data: await res.json(), calls: github.calls };
}

export async function checkSettings() {
  const errors = [];

  // 1. settings.json
  let settings = null;
  try {
    settings = JSON.parse(readText(path.join(ROOT_DIR, "settings.json")));
  } catch (e) {
    errors.push(`settings.json không đọc được (${e.message})`);
  }
  if (settings && typeof settings.show_location !== "boolean") errors.push('settings.json: "show_location" phải là true hoặc false');

  // 2. Trang Cài đặt + bánh răng ở menu mọi trang
  const page = readText(path.join(ROOT_DIR, "settings", "index.html"));
  if (!page.includes('data-key="show_location"')) errors.push("settings/index.html: thiếu công tắc Hiện vị trí highlight");
  if (!page.includes('src="../js/settings.js"') || !page.includes('src="../js/settings-page.js"')) {
    errors.push("settings/index.html: thiếu js/settings.js hoặc js/settings-page.js");
  }
  const pages = [
    ["index.html", ""],
    ["books/index.html", "../"],
    ["books/add.html", "../"],
    ["settings/index.html", "../"],
    ...readBooks().map((b) => [`novels/${b.slug}/index.html`, "../../"]),
  ];
  for (const [name, prefix] of pages) {
    const html = readText(path.join(ROOT_DIR, name));
    if (!html.includes(`href="${prefix}settings/index.html" aria-label="Cài đặt"`)) errors.push(`${name}: menu thiếu bánh răng Cài đặt`);
  }

  // 3. Chọn cài đặt: bản trong máy hay settings.json
  const { S } = runBrowser();
  const off = { show_location: false };
  const on = { show_location: true };
  const now = 1_000_000_000;
  const cases = [
    ["không tải được, chưa có gì -> mặc định (hiện)", S.choose(null, null, now).settings.show_location, true],
    ["không tải được -> dùng bản trong máy", S.choose({ settings: off, at: 0, pending: false }, null, now).settings.show_location, false],
    ["vừa bấm tắt, mạng còn bật (2 phút) -> vẫn tắt", S.choose({ settings: off, at: now - 120e3, pending: true }, on, now).settings.show_location, false],
    ["vừa bấm tắt nhưng đã 11 phút -> theo mạng", S.choose({ settings: off, at: now - 660e3, pending: true }, on, now).settings.show_location, true],
    ["máy khác đổi (bản trong máy không chờ) -> theo mạng", S.choose({ settings: on, at: now, pending: false }, off, now).settings.show_location, false],
    ["mạng đã cập nhật -> hết chờ", S.choose({ settings: off, at: now, pending: true }, off, now).pending, false],
    ["settings.json sai kiểu -> mặc định", S.clean({ show_location: "no" }).show_location, true],
  ];
  for (const [name, got, want] of cases) {
    if (got !== want) errors.push(`Cài đặt, trường hợp "${name}": ra ${got}, cần ${want}`);
  }

  // 4. Trang sách thật sự ẩn/hiện theo cài đặt
  const showLoc = readText(path.join(ROOT_DIR, "js", "show-location.js"));
  const browserCases = [
    ["settings.json tắt -> ẩn vị trí", {}, off, true],
    ["settings.json bật -> hiện vị trí", {}, on, false],
    ["mở trên máy, máy này đã tắt -> ẩn", { "library-settings": JSON.stringify({ settings: off, at: 0, pending: false }) }, null, true],
    ["máy này vừa bấm tắt, mạng chưa cập nhật -> ẩn", { "library-settings": JSON.stringify({ settings: off, at: Date.now(), pending: true }) }, on, true],
  ];
  for (const [name, store, fetched, hidden] of browserCases) {
    const panel = fakePanel();
    const run = runBrowser({ store: { ...store }, fetched, extra: showLoc, elements: { "tab-notes": panel } });
    await run.done;
    if (panel.classes.has("hide-loc") !== hidden) errors.push(`Trang sách, trường hợp "${name}": sai (đang ${hidden ? "hiện" : "ẩn"})`);
  }

  // 5. Máy chủ "Lưu cài đặt"
  const bad = [
    ["thiếu chìa khóa GitHub", on, { env: {} }, 503],
    ["địa chỉ lạ (chạy trên máy)", on, { url: "http://localhost/api/save-settings" }, 403],
    ["trang khác gửi thay", on, { headers: { Origin: "https://trang-la.com" } }, 403],
    ["không phải JSON", on, { headers: { "Content-Type": "text/plain" } }, 415],
    ["JSON hỏng", "{abc", {}, 400],
    ["sai kiểu", { show_location: "yes" }, {}, 400],
    ["thiếu cài đặt", {}, {}, 400],
    ["cài đặt lạ", { show_location: true, hack: 1 }, {}, 400],
    ["gọi GET", null, { method: "GET" }, 405],
  ];
  for (const [name, body, opts, want] of bad) {
    const r = await post(body, opts);
    if (r.status !== want) errors.push(`Lưu cài đặt, trường hợp "${name}": ra ${r.status}, cần ${want}`);
    if (r.calls.some((c) => c.method !== "GET")) errors.push(`Lưu cài đặt, trường hợp "${name}": lẽ ra không được ghi gì lên GitHub`);
  }
  for (const [url, branch] of [[MAIN, "main"], [DEV, "dev"]]) {
    const r = await post(off, { url });
    const blob = r.calls.find((c) => c.path === "/git/blobs");
    const tree = r.calls.find((c) => c.path === "/git/trees");
    const patch = r.calls.find((c) => c.method === "PATCH");
    if (r.status !== 200 || !r.data.ok) errors.push(`Lưu cài đặt (${branch}): không lưu được (${r.data.message})`);
    else if (r.data.message !== "Đã lưu, máy khác cập nhật sau 1–2 phút.") errors.push(`Lưu cài đặt: lời báo sai (${r.data.message})`);
    if (blob?.body.content !== '{\n  "show_location": false\n}\n') errors.push("Lưu cài đặt: nội dung settings.json sai");
    if (tree?.body.tree.length !== 1 || tree?.body.tree[0].path !== "settings.json") errors.push("Lưu cài đặt: phải ghi đúng một file settings.json");
    if (patch?.path !== `/git/refs/heads/${branch}`) errors.push(`Lưu cài đặt: phải lưu vào nhánh ${branch}`);
  }
  return errors;
}
