// Trang "Thêm sách" (books/add.html): chọn file Kindle + ảnh bìa, xem trước, rồi lưu.
// Lưu = gửi lên /api/save-book (functions/api/save-book.js) -> GitHub -> trang tự dựng lại.
import { parseNotebook } from "./notebook.js";
import { slugify, isValidSlug, bookStats, findExisting, buildPayload, cleanReview, reviewProblem, isValidRating } from "./add-book-helpers.js";
import { createCropper } from "./cover-crop.js";

const MAX_NOTEBOOK_BYTES = 5 * 1024 * 1024;

const $ = (id) => document.getElementById(id);
const existing = JSON.parse($("existing-books").textContent);

// Những gì người dùng đã chọn
const state = { notebook: null, data: null, cover: null, coverPicked: false, slugEdited: false, saving: false, saved: false };

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

// ---------- 2. Ảnh bìa: căn trong khung 2:3, lưu ra JPEG 600 x 900 ----------
const cropper = createCropper({
  frame: $("crop-frame"),
  img: $("crop-img"),
  zoom: $("crop-zoom"),
  onChange: refreshCover,
});

// Vẽ lại ảnh bìa (sau mỗi lần căn) cho phần xem trước
function refreshCover() {
  if (!state.coverPicked) return;
  try {
    state.cover = cropper.toJpeg();
  } catch (err) {
    state.cover = null;
    showMessage(`Ảnh bìa: ${err.message}`, "error");
  }
  renderPreview();
  update(Boolean(state.cover));
}

$("cover-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  state.cover = null;
  state.coverPicked = false;
  $("crop").hidden = !file;
  if (file) {
    $("cover-name").textContent = file.name;
    try {
      await cropper.load(file);
      state.coverPicked = true;
    } catch (err) {
      $("crop").hidden = true;
      showMessage(`Ảnh bìa: ${err.message}`, "error");
    }
  }
  if (state.coverPicked) refreshCover();
  else {
    renderPreview();
    update(false);
  }
});

// ---------- 3. Nguồn đọc, điểm, ghi chú ngắn; 4. Review ----------
function addLinkRow() {
  const row = $("link-row").content.firstElementChild.cloneNode(true);
  row.querySelector(".remove").addEventListener("click", () => {
    row.remove();
    if (!$("link-rows").children.length) addLinkRow(); // luôn còn ít nhất một dòng trống
    update(true);
  });
  $("link-rows").append(row);
  return row;
}
addLinkRow();
$("add-link").addEventListener("click", () => addLinkRow().querySelector(".url").focus());

// Những gì đang gõ trong phần 3 + 4 (đã dọn khoảng trắng)
function readReview() {
  return cleanReview({
    links: [...$("link-rows").children].map((row) => ({
      url: row.querySelector(".url").value,
      text: row.querySelector(".name").value,
    })),
    rating: $("rating").value,
    note_text: $("note-text").value,
    text: $("review-text").value,
  });
}

for (const id of ["link-rows", "rating", "note-text", "review-text"]) {
  $(id).addEventListener("input", () => {
    renderPreview();
    update(true);
  });
}

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

  // Điểm, giống thẻ ở Thư viện
  const rating = readReview().rating;
  const hasRating = rating !== "" && isValidRating(rating);
  $("pv-rating").textContent = hasRating ? `★ ${rating} / 10` : "chưa chấm";
  $("pv-rating").className = hasRating ? "rating" : "rating none";

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
  return reviewProblem(readReview());
}

// Người dùng đã gõ gì ở phần 3, 4 chưa (chưa gõ gì thì chưa cần nhắc)
function hasTyped() {
  const r = readReview();
  return Boolean(r.links.length || r.rating || r.note_text || r.text);
}

// Nút "Lưu sách" chỉ bấm được khi đủ. ok = false: thao tác vừa rồi bị lỗi, giữ lời báo lỗi đó.
function update(ok) {
  if (state.saved) return; // đã lưu xong: giữ nguyên lời báo
  const p = problem();
  $("save").disabled = Boolean(p) || state.saving;
  if (!ok && $("message").classList.contains("error")) return;
  if (p) showMessage(state.data || state.cover || hasTyped() ? p : "", "warn");
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
    const cover = cropper.toJpeg(); // lấy đúng chỗ đang căn lúc bấm lưu
    const res = await fetch("../api/save-book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload({ slug, notebook: state.notebook, coverBase64: cover.base64, review: readReview() })),
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
