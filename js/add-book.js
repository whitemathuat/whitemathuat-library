// Trang "Thêm sách" (books/add.html): chọn file Kindle + ảnh bìa, xem trước, rồi lưu.
// Lưu = gửi lên /api/save-book (functions/api/save-book.js) -> GitHub -> trang tự dựng lại.
// Chế độ "Sửa sách" (books/add.html?sua=ten-thu-muc, mở từ nút "Sửa" ở trang sách):
// điền sẵn bìa + review cũ; file Kindle không bắt buộc; chỉ gửi những phần đã đổi.
import { parseNotebook } from "./notebook.js";
import { parseReviewText } from "./review.js";
import {
  slugify, isValidSlug, bookStats, findExisting, buildPayload, cleanReview, reviewProblem, isValidRating,
  editSlugFromSearch, reviewToForm, sameReview, sameTitle,
} from "./add-book-helpers.js";
import { createCropper } from "./cover-crop.js";

const MAX_NOTEBOOK_BYTES = 5 * 1024 * 1024;

const $ = (id) => document.getElementById(id);
const existing = JSON.parse($("existing-books").textContent);

// Những gì người dùng đã chọn.
// coverChanged: bìa đã được chọn mới hoặc căn lại (khi sửa sách: chưa đổi thì giữ bìa cũ, không gửi).
const state = { notebook: null, data: null, cover: null, coverPicked: false, coverChanged: false, slugEdited: false, saving: false, saved: false };

// Khi sửa sách: { slug, ready, oldData (notes.json), original (review cũ đã dọn) }. Thêm sách mới: null.
const editSlug = editSlugFromSearch(location.search);
const edit = editSlug ? { slug: editSlug, ready: false, oldData: null, original: null } : null;
const saveLabel = edit ? "Lưu thay đổi" : "Lưu sách";

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
  state.data = edit?.oldData ?? null; // sửa sách: không chọn được file mới thì giữ ghi chú cũ
  if (file) {
    $("notebook-name").textContent = file.name;
    try {
      if (file.size > MAX_NOTEBOOK_BYTES) throw new Error("File quá lớn (tối đa 5 MB).");
      const html = await file.text();
      if (!html.includes("bookTitle")) throw new Error("File này không giống file notebook xuất từ Kindle.");
      const data = parseNotebook(html);
      state.data = data;
      state.notebook = html;
      if (!edit && !state.slugEdited) $("slug").value = slugify(data.title);
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
  state.coverChanged = true;
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
  if (!file && edit) return; // sửa sách: bấm chọn rồi bỏ ngang thì giữ bìa đang có
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
  if (edit) return editProblem();
  if (!state.data) return "Chưa chọn file ghi chú Kindle.";
  if (!state.cover) return "Chưa chọn ảnh bìa.";
  const slug = $("slug").value.trim();
  if (!isValidSlug(slug)) return "Tên thư mục chỉ gồm chữ thường không dấu, số và dấu gạch ngang (ví dụ: even-better).";
  const same = findExisting(existing, slug, state.data.title);
  if (same) return `Thư viện đã có cuốn "${same.title}" (thư mục ${same.slug}). Sửa sách cũ sẽ có ở bước sau; muốn thêm bản mới thì đổi tên thư mục.`;
  return reviewProblem(readReview());
}

// Như problem(), nhưng khi sửa sách đã có
function editProblem() {
  if (!edit.ready) return "Đang mở sách…";
  if (state.notebook && !sameTitle(state.data.title, edit.oldData.title)) {
    return `File Kindle này là của sách “${state.data.title}”, không phải “${edit.oldData.title}”.`;
  }
  if (!state.cover) return "Chưa chọn ảnh bìa.";
  const r = readReview();
  const p = reviewProblem(r);
  if (p) return p;
  if (!state.notebook && !state.coverChanged && sameReview(r, edit.original)) return "Chưa sửa gì.";
  return "";
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
  else showMessage(`Sẵn sàng. Bấm “${saveLabel}”.`, "ready");
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
    // Bìa: lấy đúng chỗ đang căn lúc bấm lưu. Sửa sách mà chưa đổi bìa thì không gửi (giữ bìa cũ).
    const coverBase64 = !edit || state.coverChanged ? cropper.toJpeg().base64 : undefined;
    const res = await fetch("../api/save-book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload({ slug, notebook: state.notebook ?? undefined, coverBase64, review: readReview() })),
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
    $("save").textContent = saveLabel;
    $("save").disabled = false;
  } finally {
    state.saving = false;
  }
});

// ---------- Sửa sách: mở sách cũ và điền sẵn ----------
// Đọc một file của sách trên trang web (không lấy bản cũ trong bộ nhớ trình duyệt).
async function fetchBookFile(name) {
  const res = await fetch(`../novels/${edit.slug}/${name}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`không mở được ${name} (lỗi ${res.status})`);
  return res;
}

async function openForEdit() {
  document.title = "Sửa sách - white đọc gây";
  $("page-title").textContent = "sửa sách.";
  $("page-sub").textContent = "sửa lại bìa, link, điểm hay đôi lời muốn lói.";
  $("back").textContent = "← Trang sách";
  $("back").href = `../novels/${edit.slug}/index.html`;
  $("notebook-hint").textContent = "Không bắt buộc. Chỉ chọn khi có file Kindle mới (ví dụ đọc thêm, có highlight mới): ghi chú cũ sẽ được thay bằng file mới.";
  $("notebook-name").textContent = "Giữ ghi chú cũ (bấm để chọn file mới)";
  $("cover-hint").textContent = "Bìa hiện tại nằm sẵn trong khung. Kéo / phóng để căn lại, hoặc chọn ảnh khác. Không đụng vào thì giữ nguyên bìa cũ.";
  $("cover-name").textContent = "Chọn ảnh bìa khác";
  $("slug-hint").textContent = "Tên thư mục của sách, không đổi được khi sửa.";
  $("slug").value = edit.slug;
  $("slug").readOnly = true;
  $("save").textContent = saveLabel;
  showMessage("Đang mở sách…");

  try {
    if (!existing.some((b) => b.slug === edit.slug)) throw new Error(`thư viện không có sách “${edit.slug}”`);

    // Ghi chú cũ (cho phần xem trước)
    const notes = await fetchBookFile("notes.json");
    if (!notes) throw new Error("không thấy notes.json của sách");
    edit.oldData = await notes.json();
    if (!state.notebook) state.data = edit.oldData;

    // Review cũ -> điền vào các ô
    const reviewRes = await fetchBookFile("review.md");
    const form = reviewToForm(reviewRes ? parseReviewText(await reviewRes.text()) : null);
    $("link-rows").replaceChildren();
    for (const link of form.links) {
      const row = addLinkRow();
      row.querySelector(".url").value = link.url;
      row.querySelector(".name").value = link.text;
    }
    if (!form.links.length) addLinkRow();
    $("rating").value = form.rating;
    $("note-text").value = form.note_text;
    $("review-text").value = form.text;
    edit.original = readReview();

    // Bìa cũ -> vào khung căn (phần xem trước hiện bìa gốc cho tới khi căn lại)
    const coverRes = await fetchBookFile("cover.jpg");
    if (coverRes) {
      const blob = await coverRes.blob();
      $("crop").hidden = false;
      await cropper.load(blob);
      state.coverPicked = true;
      state.cover = { dataUrl: URL.createObjectURL(blob) };
    }

    edit.ready = true;
    renderPreview();
    update(true);
  } catch (err) {
    showMessage(`Không mở được sách để sửa: ${err.message}`, "error");
  }
}

if (edit) openForEdit();
