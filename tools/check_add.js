// Kiểm tra trang "Thêm sách" (books/add.html + js/add-book-helpers.js), không cần trình duyệt:
// - tên thư mục tự đặt từ tên sách đúng luật của máy chủ,
// - báo đúng khi thêm sách đã có,
// - dữ liệu trang gửi đi với một file Kindle thật được máy chủ nhận (GitHub giả, không lên mạng),
// - danh sách sách đã có trong trang khớp với thư viện,
// - khung căn ảnh bìa luôn phủ kín, phóng đúng chỗ, cắt đúng phần ảnh,
// - link / điểm / review được dọn, báo sai đúng, và máy chủ ghi ra review.md đúng.
// Trả về danh sách lỗi (rỗng = ổn). Được gọi từ check.js.
import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR, NOVELS_DIR, listDirs, readText } from "./utils.js";
import { readBooks } from "./books.js";
import {
  slugify, isValidSlug, findExisting, buildPayload, base64Bytes, cleanReview, reviewProblem,
  CROP_W, CROP_H, startView, zoomView, moveView, cropRect,
} from "../js/add-book-helpers.js";
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

  // Khung căn ảnh bìa (ảnh ngang 1200 x 800 trong khung 600 x 900)
  const img = { w: 1200, h: 800 };
  const r2 = (n) => Math.round(n * 100) / 100;
  const v0 = startView(img);
  expect("bìa: vừa khung (phóng)", r2(v0.scale), 1.13); // 900 / 800
  expect("bìa: nằm giữa (x)", r2(v0.x), r2((600 - 1200 * 1.125) / 2));
  expect("bìa: không lộ trên", moveView(img, v0, 0, 500).y, 0);
  expect("bìa: không lộ phải", r2(moveView(img, v0, -5000, 0).x), r2(600 - 1200 * 1.125));
  expect("bìa: không thu nhỏ hơn khung", zoomView(img, v0, 0.1).scale, v0.scale);
  expect("bìa: phóng tối đa 4 lần", zoomView(img, v0, 99).scale, v0.scale * 4);
  const z = zoomView(img, v0, v0.scale * 2);
  const center = (v) => r2((CROP_W / 2 - v.x) / v.scale);
  expect("bìa: phóng giữ nguyên điểm giữa", center(z), center(v0));
  const cut = cropRect(v0);
  expect("bìa: cắt đủ chiều cao ảnh", r2(cut.sh), 800);
  expect("bìa: cắt đúng tỉ lệ 2:3", r2(cut.sw / cut.sh), r2(CROP_W / CROP_H));

  // Link, điểm, review
  const clean = cleanReview({
    links: [{ url: " https://a.com/x ", text: " Chính văn " }, { url: "", text: "" }],
    rating: " 8,5 ",
    note_text: "  ",
    text: "\n đoạn 1 \n\n đoạn 2 \n",
  });
  expect("review: bỏ dòng link trống", clean.links.length, 1);
  expect("review: dọn link", JSON.stringify(clean.links[0]), JSON.stringify({ url: "https://a.com/x", text: "Chính văn" }));
  expect("review: điểm dấu phẩy", clean.rating, "8.5");
  expect("review: dọn bài", clean.text, "đoạn 1 \n\n đoạn 2");
  expect("review: hợp lệ", reviewProblem(clean), "");
  const bad = (r) => reviewProblem(cleanReview(r)) !== "";
  expect("review: link thiếu địa chỉ", bad({ links: [{ url: "", text: "Chính văn" }] }), true);
  expect("review: link sai", bad({ links: [{ url: "a.com", text: "" }] }), true);
  for (const r of ["11", "-1", "abc", "8.55"]) expect(`review: điểm sai "${r}"`, bad({ rating: r }), true);
  for (const r of ["", "0", "10", "7.5"]) expect(`review: điểm đúng "${r}"`, bad({ rating: r }), false);

  // Gửi một file Kindle thật như trang làm -> máy chủ nhận, ghi đủ 3 file
  const book = listDirs(NOVELS_DIR).find((b) => fs.existsSync(path.join(NOVELS_DIR, b, "notebook.html")));
  if (book) {
    const notebook = readText(path.join(NOVELS_DIR, book, "notebook.html"));
    const cover = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64");
    const github = fakeGithub();
    const request = new Request("https://dev.whitemathuat-library.pages.dev/api/save-book", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://dev.whitemathuat-library.pages.dev" },
      body: JSON.stringify(
        buildPayload({
          slug: "sach-thu",
          notebook,
          coverBase64: cover,
          review: { links: [{ url: "https://a.com/x", text: "Chính văn" }], rating: "9", note_text: "bản dịch", text: "hay" },
        })
      ),
    });
    const res = await handleSave(request, { GITHUB_TOKEN: "token-thu" }, github.fetchFn);
    expect("máy chủ nhận dữ liệu trang gửi", res.status, 200);
    const files = github.calls.find((c) => c.path === "/git/trees")?.body.tree.map((t) => t.path.split("/").pop()).join(",");
    expect("các file được lưu", files, "notebook.html,cover.jpg,review.md");
    const reviewMd = github.calls.filter((c) => c.path === "/git/blobs").pop()?.body.content ?? "";
    const [head, body] = reviewMd.split("\n---\n");
    expect("review.md: thông tin", head.replace(/\ndate: .*/, ""), "link: https://a.com/x | Chính văn\nnote_text: bản dịch\nrating: 9");
    expect("review.md: bài review", body, "hay\n");
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
