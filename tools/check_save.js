// Kiểm tra chức năng "Lưu sách" (functions/api/save-book.js) với một GitHub GIẢ:
// không gửi gì lên mạng. Thử các trường hợp sai (phải bị chặn) và một lần lưu đúng
// (phải tạo đúng một commit với đúng các file, đúng nhánh).
// Trả về danh sách lỗi (rỗng = ổn). Được gọi từ check.js.
import { handleSave, branchForHost, makeReviewMd } from "../functions/api/save-book.js";

const ENV = { GITHUB_TOKEN: "token-thu" }; // chìa khóa giả
const MAIN = "https://whitemathuat-library.pages.dev/api/save-book";
const DEV = "https://dev.whitemathuat-library.pages.dev/api/save-book";
const NOTEBOOK = '<div class="bookTitle">Sách thử</div>';
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64");

// GitHub giả: ghi lại mọi lần gọi, trả lời như GitHub thật. (Dùng cả trong check_add.js)
export function fakeGithub({ existingBooks = [], refConflicts = 0 } = {}) {
  const calls = [];
  const fetchFn = async (url, opts) => {
    const path = url.replace("https://api.github.com/repos/whitemathuat/whitemathuat-library", "");
    const body = opts.body ? JSON.parse(opts.body) : null;
    calls.push({ method: opts.method, path, body });
    const reply = (data, status = 200) => new Response(JSON.stringify(data), { status });
    if (opts.method === "GET" && path.startsWith("/git/ref/heads/")) return reply({ object: { sha: "cha" } });
    if (opts.method === "GET" && path.startsWith("/git/commits/")) return reply({ tree: { sha: "cay-cu" } });
    if (opts.method === "GET" && path.startsWith("/contents/")) {
      const found = existingBooks.some((b) => path.startsWith(`/contents/novels/${b}/`));
      return found ? reply({}) : reply({ message: "Not Found" }, 404);
    }
    if (path === "/git/blobs") return reply({ sha: `blob${calls.length}` }, 201);
    if (path === "/git/trees") return reply({ sha: "cay-moi" }, 201);
    if (path === "/git/commits") return reply({ sha: "commit-moi" }, 201);
    if (opts.method === "PATCH") {
      if (refConflicts > 0) {
        refConflicts--;
        return reply({ message: "Update is not a fast forward" }, 422);
      }
      return reply({});
    }
    return reply({ message: "?" }, 500);
  };
  return { calls, fetchFn };
}

// Gửi một yêu cầu lưu giả; trả về { status, data, calls }.
async function save(body, { url = MAIN, env = ENV, headers = {}, github = fakeGithub(), method = "POST" } = {}) {
  const request = new Request(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: method === "POST" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });
  const res = await handleSave(request, env, github.fetchFn);
  return { status: res.status, data: await res.json(), calls: github.calls };
}

export async function checkSave() {
  const errors = [];
  const expect = (name, got, want) => {
    if (got !== want) errors.push(`Lưu sách, trường hợp "${name}": ra ${got}, cần ${want}`);
  };

  // Các trường hợp phải bị chặn
  const bad = [
    ["thiếu chìa khóa GitHub", { slug: "a", notebook: NOTEBOOK }, { env: {} }, 503],
    ["địa chỉ lạ (chạy trên máy)", { slug: "a", notebook: NOTEBOOK }, { url: "http://localhost/api/save-book" }, 403],
    ["trang khác gửi thay", { slug: "a", notebook: NOTEBOOK }, { headers: { Origin: "https://trang-la.com" } }, 403],
    ["không phải JSON", { slug: "a", notebook: NOTEBOOK }, { headers: { "Content-Type": "text/plain" } }, 415],
    ["JSON hỏng", "{abc", {}, 400],
    ["tên thư mục có dấu/chữ hoa", { slug: "Sách Mới", notebook: NOTEBOOK }, {}, 400],
    ["tên thư mục kiểu ../", { slug: "../functions", notebook: NOTEBOOK }, {}, 400],
    ["không có gì để lưu", { slug: "a" }, {}, 400],
    ["notebook không phải của Kindle", { slug: "a", notebook: "<p>hi</p>" }, {}, 400],
    ["ảnh không phải JPEG", { slug: "a", notebook: NOTEBOOK, cover: Buffer.from("PNG").toString("base64") }, {}, 400],
    ["ảnh quá nặng", { slug: "a", notebook: NOTEBOOK, cover: Buffer.alloc(301 * 1024, 0xff).toString("base64") }, {}, 400],
    ["sách mới mà thiếu notebook", { slug: "sach-moi", review: { text: "hay" } }, {}, 400],
    ["link không phải http", { slug: "a", notebook: NOTEBOOK, review: { links: [{ url: "javascript:alert(1)" }] } }, {}, 400],
    ["điểm sai", { slug: "a", notebook: NOTEBOOK, review: { rating: "11" } }, {}, 400],
    ["chèn dòng vào thông tin review", { slug: "a", notebook: NOTEBOOK, review: { rating: "9\nlink: x" } }, {}, 400],
  ];
  for (const [name, body, opts, want] of bad) {
    const r = await save(body, opts);
    expect(name, r.status, want);
    if (r.calls.some((c) => c.method !== "GET")) errors.push(`Lưu sách, trường hợp "${name}": lẽ ra không được ghi gì lên GitHub`);
  }

  // Lưu đúng: sách mới đủ 3 file -> một commit, đúng đường dẫn, nhánh main
  const good = await save({ slug: "sach-thu", notebook: NOTEBOOK, cover: JPEG, review: { rating: "10", text: "Hay" } });
  expect("lưu sách mới đủ file", good.status, 200);
  const tree = good.calls.find((c) => c.path === "/git/trees")?.body.tree.map((t) => t.path).join(",");
  expect("đường dẫn các file", tree, "novels/sach-thu/notebook.html,novels/sach-thu/cover.jpg,novels/sach-thu/review.md");
  expect("lưu vào nhánh", good.calls.find((c) => c.method === "PATCH")?.path, "/git/refs/heads/main");
  expect("tên người lưu", good.calls.find((c) => c.path === "/git/commits")?.body.author.name, "whitemathuat");

  // Sửa review của sách đã có (không gửi lại notebook) trên bản thử dev
  const edit = await save({ slug: "even-better", review: { text: "Mới" } }, { url: DEV, github: fakeGithub({ existingBooks: ["even-better"] }) });
  expect("sửa review sách đã có", edit.status, 200);
  expect("bản dev lưu vào nhánh", edit.calls.find((c) => c.method === "PATCH")?.path, "/git/refs/heads/dev");

  // Nhánh vừa bị lần lưu khác chen vào -> tự thử lại và thành công
  const retry = await save({ slug: "a", notebook: NOTEBOOK }, { github: fakeGithub({ refConflicts: 1 }) });
  expect("thử lại khi bị chen", retry.status, 200);

  // Kiểm tra chìa khóa (GET) không ghi gì
  const status = await save(null, { method: "GET" });
  expect("kiểm tra chìa khóa", status.status, 200);

  // Nhánh theo địa chỉ trang
  expect("địa chỉ bản thử khác", branchForHost("abc123.whitemathuat-library.pages.dev"), null);

  // review.md đúng mẫu mà tools/books.js đọc
  const md = makeReviewMd({ links: [{ url: "https://a.com/x", text: "Chính văn" }], rating: "9.5", text: "Bài\n---\nhay" }, "01/02/2026");
  expect("mẫu review.md", md, "link: https://a.com/x | Chính văn\nrating: 9.5\ndate: 01/02/2026\n---\nBài\n---\nhay\n");

  return errors;
}
