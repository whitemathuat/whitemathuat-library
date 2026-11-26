// Trang "Thêm sách" (books/add.html): chọn file Kindle + ảnh bìa, xem trước, rồi lưu.
// Lưu = gửi lên /api/save-book (functions/api/save-book.js) -> GitHub -> trang tự dựng lại.
import { parseNotebook } from "./notebook.js";
import { slugify, isValidSlug, bookStats, findExisting, buildPayload, base64Bytes } from "./add-book-helpers.js";

const COVER_WIDTH = 600; // giống npm run covers
const MAX_COVER_BYTES = 300 * 1024; // giống giới hạn của máy chủ
const MAX_NOTEBOOK_BYTES = 5 * 1024 * 1024;

const $ = (id) => document.getElementById(id);
const existing = JSON.parse($("existing-books").textContent);

// Những gì người dùng đã chọn
const state = { notebook: null, data: null, cover: null, slugEdited: false, saving: false, saved: false };

// Trang đã chạy được: ẩn dòng "chỉ dùng online", hiện khung nhập
$("offline").hidden = true;
$("add-form").hidden = false;

function showMessage(text, kind = "") {
  $("message").textContent = text;
  $("message").className = `message ${kind}`;
}

// ---------- 1. File Kindle ----------
$("notebook-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  state.notebook = null;
  state.data = null;
  if (file) {
    $("notebook-name").textContent = file.name;
    try {
      if (file.size > MAX_NOTEBOOK_BYTES) throw new Error("File quá lớn (tối đa 5 MB).");
      const html = await file.text();
      if (!html.includes("bookTitle")) throw new Error("File này không giống file notebook xuất từ Kindle.");
      state.data = parseNotebook(html);
      state.notebook = html;
      if (!state.slugEdited) $("slug").value = slugify(state.data.title);
    } catch (err) {
      showMessage(`Không đọc được file: ${err.message}`, "error");
    }
  }
  renderPreview();
  update(Boolean(state.data));
});

// ---------- 2. Ảnh bìa: thu nhỏ còn 600 px ngang, lưu dạng JPEG ----------
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Trình duyệt không mở được ảnh này. Hãy thử ảnh JPG hoặc PNG."));
    img.src = URL.createObjectURL(file);
  });
}

async function shrinkCover(file) {
  const img = await loadImage(file);
  const width = Math.min(COVER_WIDTH, img.naturalWidth);
  const height = Math.round((img.naturalHeight * width) / img.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; // ảnh PNG trong suốt -> nền trắng
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(img.src);
  // Còn nặng quá thì giảm chất lượng dần
  for (let quality = 0.85; quality >= 0.4; quality -= 0.15) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const base64 = dataUrl.split(",")[1];
    if (base64Bytes(base64) <= MAX_COVER_BYTES) return { dataUrl, base64 };
  }
  throw new Error("Ảnh vẫn quá nặng sau khi thu nhỏ.");
}

$("cover-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  state.cover = null;
  if (file) {
    $("cover-name").textContent = file.name;
    try {
      state.cover = await shrinkCover(file);
    } catch (err) {
      showMessage(`Ảnh bìa: ${err.message}`, "error");
    }
  }
  renderPreview();
  update(Boolean(state.cover));
});

// ---------- 3. Tên thư mục ----------
$("slug").addEventListener("input", () => {
  state.slugEdited = true;
  update(true);
});

// ---------- Xem trước ----------
function renderPreview() {
  const box = $("cover-box");
  box.replaceChildren();
  if (state.cover) {
    const img = document.createElement("img");
    img.src = state.cover.dataUrl;
    img.alt = "Bìa sách";
    box.append(img);
  } else {
    box.append(Object.assign(document.createElement("span"), { textContent: "Bìa" }));
  }

  const data = state.data;
  $("pv-title").textContent = data?.title || "Tên sách";
  $("pv-author").textContent = data?.author || "Tác giả";
  const stats = data ? bookStats(data) : { chapters: [], highlights: 0, notes: 0 };
  const statsBox = $("pv-stats");
  statsBox.replaceChildren();
  for (const [count, label] of [[stats.highlights, "highlight"], [stats.notes, "ghi chú"], [stats.chapters.length, "chương"]]) {
    const span = document.createElement("span");
    span.append(Object.assign(document.createElement("b"), { textContent: count }), ` ${label}`);
    statsBox.append(span);
  }

  const list = $("pv-chapter-list");
  list.replaceChildren();
  for (const ch of stats.chapters) {
    const li = document.createElement("li");
    li.append(
      Object.assign(document.createElement("span"), { textContent: ch.title }),
      Object.assign(document.createElement("small"), { textContent: `${ch.highlights} hl · ${ch.notes} gc` })
    );
    list.append(li);
  }
  $("pv-chapters").hidden = stats.chapters.length === 0;
}

// Còn thiếu gì để lưu? Trả về lời nhắc, hoặc "" nếu đã đủ.
function problem() {
  if (!state.data) return "Chưa chọn file ghi chú Kindle.";
  if (!state.cover) return "Chưa chọn ảnh bìa.";
  const slug = $("slug").value.trim();
  if (!isValidSlug(slug)) return "Tên thư mục chỉ gồm chữ thường không dấu, số và dấu gạch ngang (ví dụ: even-better).";
  const same = findExisting(existing, slug, state.data.title);
  if (same) return `Thư viện đã có cuốn "${same.title}" (thư mục ${same.slug}). Sửa sách cũ sẽ có ở bước sau; muốn thêm bản mới thì đổi tên thư mục.`;
  return "";
}

// Nút "Lưu sách" chỉ bấm được khi đủ. ok = false: thao tác vừa rồi bị lỗi, giữ lời báo lỗi đó.
function update(ok) {
  if (state.saved) return; // đã lưu xong: giữ nguyên lời báo
  const p = problem();
  $("save").disabled = Boolean(p) || state.saving;
  if (!ok && $("message").classList.contains("error")) return;
  if (p) showMessage(state.data || state.cover ? p : "", "warn");
  else showMessage("Sẵn sàng. Bấm “Lưu sách”.", "ready");
}

// ---------- Lưu ----------
$("add-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (problem() || state.saving) return;
  state.saving = true;
  $("save").disabled = true;
  $("save").textContent = "Đang lưu…";
  showMessage("Đang gửi lên GitHub, chờ chút…");
  const slug = $("slug").value.trim();
  try {
    const res = await fetch("../api/save-book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload({ slug, notebook: state.notebook, coverBase64: state.cover.base64 })),
    });
    let reply = {};
    try {
      reply = await res.json();
    } catch {
      // máy chủ không trả JSON (ví dụ chưa đăng nhập)
    }
    if (!res.ok || !reply.ok) throw new Error(reply.message || `Máy chủ trả lỗi ${res.status}`);
    state.saved = true;
    $("save").textContent = "Đã lưu";
    showMessage("", "ok");
    const link = Object.assign(document.createElement("a"), { href: `../novels/${slug}/index.html`, textContent: "Mở trang sách" });
    $("message").replaceChildren(`${reply.message} `, link, " (bấm sau 1–2 phút).");
  } catch (err) {
    showMessage(`Chưa lưu được: ${err.message}`, "error");
    $("save").textContent = "Lưu sách";
    $("save").disabled = false;
  } finally {
    state.saving = false;
  }
});
