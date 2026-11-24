// Cổng mật khẩu cho cả trang web (chạy trên Cloudflare trước mỗi lần mở trang).
// Trình duyệt hiện ô đăng nhập; tên và mật khẩu đúng nằm trong biến USERNAME, PASSWORD
// đặt trên Cloudflare (không ghi trong code).
// Mọi trường hợp lạ (thiếu biến, chữ đăng nhập hỏng) đều bị chặn lịch sự bằng lỗi 401,
// không bao giờ làm sập trang (lỗi 500).

// Trả lời "cần đăng nhập": trình duyệt sẽ hiện ô đăng nhập.
function askToLogin(message) {
  return new Response(message, {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Private Library", charset="UTF-8"' },
  });
}

// Đọc tên + mật khẩu từ dòng "Authorization: Basic xxxx" mà trình duyệt gửi.
// Trả về null nếu dòng đó sai dạng hoặc giải mã không được.
export function readLogin(header) {
  const match = /^Basic\s+(\S+)\s*$/i.exec(header || "");
  if (!match) return null;
  try {
    const bytes = Uint8Array.from(atob(match[1]), (c) => c.charCodeAt(0));
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const colon = text.indexOf(":");
    if (colon < 0) return null;
    return { user: text.slice(0, colon), pass: text.slice(colon + 1) };
  } catch {
    return null; // chữ mã hoá hỏng: coi như chưa đăng nhập
  }
}

export async function onRequest(context) {
  const { USERNAME, PASSWORD } = context.env;

  // Quên đặt biến trên Cloudflare: khoá cửa luôn, không cho ai vào.
  if (!USERNAME || !PASSWORD) {
    return new Response("Site is not configured", { status: 503 });
  }

  const login = readLogin(context.request.headers.get("Authorization"));
  if (!login) return askToLogin("Authentication required");
  if (login.user !== USERNAME || login.pass !== PASSWORD) return askToLogin("Unauthorized");

  return context.next();
}
