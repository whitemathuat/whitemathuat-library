// Kiểm tra cổng mật khẩu (functions/_middleware.js) với các kiểu đăng nhập khác nhau,
// kể cả chữ đăng nhập hỏng. Không trường hợp nào được làm sập trang (lỗi 500).
// Trả về danh sách lỗi (rỗng = ổn). Được gọi từ check.js.
import { onRequest } from "../functions/_middleware.js";

const ENV = { USERNAME: "white", PASSWORD: "mật:khẩu" }; // dữ liệu thử, không phải mật khẩu thật

// Mã hoá "tên:mật khẩu" giống trình duyệt (UTF-8 rồi base64).
const basic = (text) => "Basic " + Buffer.from(text, "utf-8").toString("base64");

// Giả lập một lần mở trang; trả về mã trạng thái (200 = vào được).
async function statusFor(header, env = ENV) {
  const headers = new Headers();
  if (header !== undefined) headers.set("Authorization", header);
  const context = {
    env,
    request: new Request("https://example.com/", { headers }),
    next: async () => new Response("ok", { status: 200 }),
  };
  try {
    return (await onRequest(context)).status;
  } catch {
    return 500;
  }
}

export async function checkLogin() {
  const cases = [
    ["đúng tên + mật khẩu (có dấu và dấu :)", basic("white:mật:khẩu"), 200],
    ["chữ Basic viết thường", basic("white:mật:khẩu").replace("Basic", "basic"), 200],
    ["không gửi đăng nhập", undefined, 401],
    ["sai mật khẩu", basic("white:sai"), 401],
    ["thiếu dấu :", basic("white"), 401],
    ["chỉ có chữ Basic", "Basic", 401],
    ["base64 hỏng", "Basic %%%###", 401],
    ["kiểu đăng nhập khác", "Bearer abc", 401],
    ["dòng rỗng", "", 401],
  ];
  const errors = [];
  for (const [name, header, want] of cases) {
    const got = await statusFor(header);
    if (got !== want) errors.push(`Cổng mật khẩu, trường hợp "${name}": ra ${got}, cần ${want}`);
  }
  // Quên đặt biến trên Cloudflare thì phải khoá cửa, kể cả khi gõ "undefined:undefined".
  const got = await statusFor(basic("undefined:undefined"), {});
  if (got !== 503) errors.push(`Cổng mật khẩu khi thiếu biến USERNAME/PASSWORD: ra ${got}, cần 503`);
  return errors;
}
