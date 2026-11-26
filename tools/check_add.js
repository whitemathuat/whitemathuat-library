// Kiểm tra trang "Thêm sách" (books/add.html + js/add-book-helpers.js), không cần trình duyệt:
// - tên thư mục tự đặt từ tên sách đúng luật của máy chủ,
// - báo đúng khi thêm sách đã có,
// - dữ liệu trang gửi đi với một file Kindle thật được máy chủ nhận (GitHub giả, không lên mạng),
// - danh sách sách đã có trong trang khớp với thư viện.
// Trả về danh sách lỗi (rỗng = ổn). Được gọi từ check.js.
import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR, NOVELS_DIR, listDirs, readText } from "./utils.js";
import { readBooks } from "./books.js";
import { slugify, isValidSlug, findExisting, buildPayload, base64Bytes } from "../js/add-book-helpers.js";
import { handleSave } from "../functions/api/save-book.js";
import { fakeGithub } from "./check_save.js";

export async function checkAdd() {
  const errors = [];
  const expect = (name, got, want) => {
    if (got !== want) errors.push(`Trang Thêm sách, "${name}": ra ${JSON.stringify(got)}, cần ${JSON.stringify(want)}`);
  };

  // Tên thư mục từ tên sách
  const slugs = [
    ["Even Better", "even-better"],
    ["Đắc Nhân Tâm", "dac-nhan-tam"],
    ["  Unknown Lover: A Novel (Book 2) ", "unknown-lover-a-novel-book-2"],
    ["Tiếng Việt có dấu ỗ ữ ặ", "tieng-viet-co-dau-o-u-a"],
    ["!!!", ""],
  ];
  for (const [title, want] of slugs) expect(`tên thư mục của "${title}"`, slugify(title), want);
  const long = slugify("a ".repeat(80));
  if (!isValidSlug(long)) errors.push(`Trang Thêm sách: tên thư mục quá dài không hợp lệ ("${long}")`);

  // Thêm sách trùng
  const existing = [{ slug: "even-better", title: "Even Better" }];
  expect("trùng thư mục", findExisting(existing, "even-better", "X")?.slug, "even-better");
  expect("trùng tên sách", findExisting(existing, "khac", " even better ")?.slug, "even-better");
  expect("sách mới", findExisting(existing, "khac", "Khác"), null);

  expect("cỡ ảnh base64", base64Bytes(Buffer.from("abcde").toString("base64")), 5);

  // Gửi một file Kindle thật như trang làm -> máy chủ nhận, ghi đủ 3 file
  const book = listDirs(NOVELS_DIR).find((b) => fs.existsSync(path.join(NOVELS_DIR, b, "notebook.html")));
  if (book) {
    const notebook = readText(path.join(NOVELS_DIR, book, "notebook.html"));
    const cover = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64");
    const github = fakeGithub();
    const request = new Request("https://dev.whitemathuat-library.pages.dev/api/save-book", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://dev.whitemathuat-library.pages.dev" },
      body: JSON.stringify(buildPayload({ slug: "sach-thu", notebook, coverBase64: cover })),
    });
    const res = await handleSave(request, { GITHUB_TOKEN: "token-thu" }, github.fetchFn);
    expect("máy chủ nhận dữ liệu trang gửi", res.status, 200);
    const files = github.calls.find((c) => c.path === "/git/trees")?.body.tree.map((t) => t.path.split("/").pop()).join(",");
    expect("các file được lưu", files, "notebook.html,cover.jpg,review.md");
  }

  // Danh sách sách đã có trong books/add.html khớp với thư viện
  const page = path.join(ROOT_DIR, "books", "add.html");
  if (fs.existsSync(page)) {
    const m = readText(page).match(/<script type="application\/json" id="existing-books">([\s\S]*?)<\/script>/);
    const inPage = m ? JSON.parse(m[1]).map((b) => b.slug).join(",") : "(không thấy)";
    const real = readBooks().map((b) => b.slug).sort().join(",");
    expect("danh sách sách đã có", inPage, real);
  }

  return errors;
}
