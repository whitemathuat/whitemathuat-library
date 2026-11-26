// Chức năng "Lưu sách" của trang web: nhận file sách từ trình duyệt rồi ghi lên GitHub
// thành MỘT lần lưu (commit). Sau đó GitHub tự dựng trang (.github/workflows/build-books.yml)
// và Cloudflare tự đưa lên mạng.
//
// Nằm sau cổng mật khẩu (functions/_middleware.js chặn mọi đường dẫn, kể cả /api).
// Cần biến bí mật GITHUB_TOKEN trên Cloudflare (chìa khóa chỉ mở được kho sách này).
//
//   GET  /api/save-book  -> kiểm tra chìa khóa có dùng được không (không ghi gì)
//   POST /api/save-book  -> lưu sách. Gửi JSON:
//     { slug: "ten-sach",
//       notebook: "<html...>"            (file Kindle; bắt buộc với sách mới)
//       cover: "base64 của ảnh JPEG"      (không bắt buộc)
//       review: { links: [{url, text}], rating: "10", note_text: "", text: "bài review" } (không bắt buộc) }
//   POST /api/save-book  -> xóa hẳn một cuốn: { slug: "ten-sach", delete: true }
//     (xóa cả thư mục novels/ten-sach trong một lần lưu; vẫn lấy lại được từ lịch sử Git)

const REPO = "whitemathuat/whitemathuat-library";
const PRODUCTION_HOST = "whitemathuat-library.pages.dev"; // trang chính -> nhánh main (lên mạng)
const DEV_HOST = "dev.whitemathuat-library.pages.dev"; // bản thử của nhánh dev -> nhánh dev
const AUTHOR = { name: "whitemathuat", email: "294406544+whitemathuat@users.noreply.github.com" };

const MAX_NOTEBOOK_BYTES = 5 * 1024 * 1024; // file Kindle lớn nhất ~5 MB
const MAX_COVER_BYTES = 300 * 1024; // giống giới hạn của npm run check
const MAX_REVIEW_CHARS = 50000;

// Lỗi có lời giải thích cho người dùng (hiện ra trên trang web).
class UserError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

// Trang nào thì lưu vào nhánh đó. Địa chỉ lạ (chạy trên máy, bản thử khác) -> không cho lưu.
export function branchForHost(host) {
  if (host === PRODUCTION_HOST) return "main";
  if (host === DEV_HOST) return "dev";
  return null;
}

// Gọi GitHub. Trả về dữ liệu JSON, hoặc báo lỗi dễ hiểu.
async function github(fetchFn, token, method, apiPath, body) {
  const res = await fetchFn(`https://api.github.com/repos/${REPO}${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "reading-library-site",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 404 && method === "GET") return null; // không có (file chưa tồn tại...)
  if (!res.ok) {
    const hint = res.status === 401 || res.status === 403 ? " (chìa khóa GitHub sai, hết hạn hoặc thiếu quyền)" : "";
    const err = new UserError(`GitHub trả lỗi ${res.status}${hint}`, 502);
    err.githubStatus = res.status;
    throw err;
  }
  return res.status === 204 ? {} : res.json();
}

// Một dòng thông tin trong review.md không được chứa xuống dòng (sẽ làm hỏng file).
function oneLine(value, name) {
  const text = String(value ?? "").trim();
  if (/[\r\n]/.test(text)) throw new UserError(`${name} không được xuống dòng`);
  return text;
}

// Ngày hôm nay theo giờ Việt Nam, dạng dd/mm/yyyy
export function todayVN(now = new Date()) {
  return now.toLocaleDateString("en-GB", { timeZone: "Asia/Ho_Chi_Minh" });
}

// Tạo nội dung review.md đúng mẫu mà tools/books.js đọc.
export function makeReviewMd(review, date) {
  const lines = [];
  for (const link of review.links ?? []) {
    const url = oneLine(link.url, "Link");
    if (!/^https?:\/\/\S+$/.test(url)) throw new UserError(`Link không hợp lệ: ${url}`);
    const text = oneLine(link.text, "Tên link").replace(/\|/g, "/");
    lines.push(`link: ${url}${text ? ` | ${text}` : ""}`);
  }
  const noteText = oneLine(review.note_text, "Ghi chú ngắn");
  if (noteText) lines.push(`note_text: ${noteText}`);
  const rating = oneLine(review.rating, "Điểm");
  if (rating) {
    if (!/^(10|[0-9])(\.[0-9])?$/.test(rating) || Number(rating) > 10) throw new UserError("Điểm phải từ 0 đến 10");
    lines.push(`rating: ${rating}`);
  }
  lines.push(`date: ${date}`);
  const text = String(review.text ?? "").trim();
  if (text.length > MAX_REVIEW_CHARS) throw new UserError("Bài review quá dài");
  return `${lines.join("\n")}\n---\n${text}\n`;
}

// Tên thư mục sách phải đúng luật (chặn cả kiểu "../functions").
function checkSlug(body) {
  if (!body || typeof body !== "object") throw new UserError("Dữ liệu gửi lên không đúng dạng");
  const slug = String(body.slug ?? "");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 60) {
    throw new UserError("Tên thư mục sách chỉ gồm chữ thường không dấu, số và dấu gạch ngang (ví dụ: even-better)");
  }
  return slug;
}

// Kiểm tra dữ liệu gửi lên, trả về danh sách file cần ghi: [{ path, content, encoding }]
function filesFromBody(body) {
  const slug = checkSlug(body);
  const dir = `novels/${slug}`;
  const files = [];

  if (body.notebook != null) {
    const html = String(body.notebook);
    if (new TextEncoder().encode(html).length > MAX_NOTEBOOK_BYTES) throw new UserError("File notebook quá lớn (tối đa 5 MB)");
    if (!html.includes("bookTitle")) throw new UserError("File này không giống file notebook xuất từ Kindle");
    files.push({ path: `${dir}/notebook.html`, content: html, encoding: "utf-8" });
  }

  if (body.cover != null) {
    let bytes;
    try {
      bytes = Uint8Array.from(atob(String(body.cover)), (c) => c.charCodeAt(0));
    } catch {
      throw new UserError("Ảnh bìa bị hỏng khi gửi lên");
    }
    if (bytes.length > MAX_COVER_BYTES) throw new UserError("Ảnh bìa quá nặng (tối đa 300 KB)");
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new UserError("Ảnh bìa phải là ảnh JPEG");
    files.push({ path: `${dir}/cover.jpg`, content: String(body.cover), encoding: "base64" });
  }

  if (body.review != null) {
    if (typeof body.review !== "object") throw new UserError("Phần review không đúng dạng");
    files.push({ path: `${dir}/review.md`, content: makeReviewMd(body.review, todayVN()), encoding: "utf-8" });
  }

  if (!files.length) throw new UserError("Chưa có gì để lưu");
  return { slug, dir, files };
}

// Liệt kê mọi file trong một thư mục trên GitHub (kể cả thư mục con). Không có thư mục -> [].
async function listFiles(fetchFn, token, branch, dir) {
  const items = await github(fetchFn, token, "GET", `/contents/${dir}?ref=${branch}`);
  if (!Array.isArray(items)) return [];
  const paths = [];
  for (const item of items) {
    if (item.type === "dir") paths.push(...(await listFiles(fetchFn, token, branch, item.path)));
    else paths.push(item.path);
  }
  return paths;
}

// Ghi các file lên nhánh thành một lần lưu. File có delete: true thì bị xóa. Nếu đúng lúc đó nhánh vừa đổi, thử lại một lần.
async function commitFiles(fetchFn, token, branch, message, files) {
  for (let attempt = 1; ; attempt++) {
    const ref = await github(fetchFn, token, "GET", `/git/ref/heads/${branch}`);
    if (!ref) throw new UserError(`Không thấy nhánh ${branch} trên GitHub`, 502);
    const parentSha = ref.object.sha;
    const parent = await github(fetchFn, token, "GET", `/git/commits/${parentSha}`);

    const tree = [];
    for (const f of files) {
      if (f.delete) {
        tree.push({ path: f.path, mode: "100644", type: "blob", sha: null }); // sha null = xóa file này
        continue;
      }
      const blob = await github(fetchFn, token, "POST", "/git/blobs", { content: f.content, encoding: f.encoding });
      tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
    }
    const newTree = await github(fetchFn, token, "POST", "/git/trees", { base_tree: parent.tree.sha, tree });
    const when = new Date().toISOString();
    const commit = await github(fetchFn, token, "POST", "/git/commits", {
      message,
      tree: newTree.sha,
      parents: [parentSha],
      author: { ...AUTHOR, date: when },
      committer: { ...AUTHOR, date: when },
    });
    try {
      await github(fetchFn, token, "PATCH", `/git/refs/heads/${branch}`, { sha: commit.sha, force: false });
      return commit.sha;
    } catch (e) {
      // 422 = nhánh vừa có lần lưu khác chen vào -> làm lại từ đầu một lần
      if (e.githubStatus === 422 && attempt < 2) continue;
      throw e;
    }
  }
}

// Phần chính, tách riêng để tools/check_save.js thử được với GitHub giả.
export async function handleSave(request, env, fetchFn = fetch) {
  try {
    const url = new URL(request.url);
    const branch = branchForHost(url.host);
    if (!branch) throw new UserError("Chỉ lưu được từ trang web chính hoặc bản thử dev", 403);
    if (!env.GITHUB_TOKEN) throw new UserError("Chưa đặt chìa khóa GITHUB_TOKEN trên Cloudflare", 503);
    const token = env.GITHUB_TOKEN;

    // Kiểm tra chìa khóa: đọc thử nhánh, không ghi gì.
    if (request.method === "GET") {
      const ref = await github(fetchFn, token, "GET", `/git/ref/heads/${branch}`);
      if (!ref) throw new UserError(`Chìa khóa không đọc được kho sách (nhánh ${branch})`, 502);
      return json({ ok: true, message: `Chìa khóa dùng được. Sách sẽ lưu vào nhánh ${branch}.`, branch });
    }
    if (request.method !== "POST") throw new UserError("Cách gọi không được hỗ trợ", 405);

    // Chống trang lạ gửi lệnh lưu thay bạn: phải gửi JSON, và (nếu có) từ chính trang này.
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin) throw new UserError("Yêu cầu đến từ trang khác", 403);
    if (!(request.headers.get("Content-Type") || "").startsWith("application/json")) {
      throw new UserError("Dữ liệu phải gửi dạng JSON", 415);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      throw new UserError("Dữ liệu gửi lên không đọc được");
    }

    // Xóa hẳn một cuốn sách: bỏ cả thư mục của nó trong một lần lưu.
    if (body?.delete === true) {
      const slug = checkSlug(body);
      const paths = await listFiles(fetchFn, token, branch, `novels/${slug}`);
      if (!paths.length) throw new UserError(`Thư viện không có sách “${slug}”`, 404);
      const files = paths.map((path) => ({ path, delete: true }));
      const sha = await commitFiles(fetchFn, token, branch, `Website: delete book ${slug}`, files);
      return json({ ok: true, message: "Đã xóa. Thư viện sẽ cập nhật sau khoảng 1–2 phút.", branch, commit: sha });
    }

    const { slug, dir, files } = filesFromBody(body);

    // Sách mới (chưa có notebook trên GitHub) thì bắt buộc phải gửi kèm notebook.
    if (!files.some((f) => f.path.endsWith("/notebook.html"))) {
      const existing = await github(fetchFn, token, "GET", `/contents/${dir}/notebook.html?ref=${branch}`);
      if (!existing) throw new UserError("Sách mới cần có file notebook");
    }

    const names = files.map((f) => f.path.split("/").pop()).join(", ");
    const sha = await commitFiles(fetchFn, token, branch, `Website: save book ${slug} (${names})`, files);
    return json({ ok: true, message: "Đã lưu. Trang sẽ cập nhật sau khoảng 1–2 phút.", branch, commit: sha });
  } catch (e) {
    if (e instanceof UserError) return json({ ok: false, message: e.message }, e.status);
    return json({ ok: false, message: "Lỗi không mong đợi khi lưu" }, 500);
  }
}

export const onRequest = (context) => handleSave(context.request, context.env);
