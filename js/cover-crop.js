// Khung căn ảnh bìa trên trang "Thêm sách", giống đặt ảnh đại diện:
// kéo ảnh để di chuyển; phóng to/nhỏ bằng thanh trượt, con lăn chuột hoặc hai ngón tay;
// bàn phím: mũi tên để di chuyển, + / - để phóng.
// Phần tính toán (giữ ảnh phủ kín khung...) nằm ở add-book-helpers.js để kiểm tra được bằng Node.
import { CROP_W, CROP_H, MAX_ZOOM, minScale, startView, clampView, zoomView, moveView, cropRect, base64Bytes } from "./add-book-helpers.js";

const MAX_COVER_BYTES = 300 * 1024; // giống giới hạn của máy chủ

// frame = khung (div), img = ảnh bên trong, zoom = thanh trượt.
// onChange() được gọi khi người dùng căn xong (thả tay, thôi lăn chuột...).
export function createCropper({ frame, img, zoom, onChange }) {
  let image = null; // { w, h } cỡ thật của ảnh đang căn
  let view = null;
  let timer = 0;
  const pointers = new Map(); // các ngón tay / chuột đang giữ trên khung

  // Khung trên màn hình nhỏ hơn 600 px: k = số px màn hình cho 1 đơn vị khung
  const k = () => frame.clientWidth / CROP_W;

  function draw() {
    if (!image) return;
    const s = k();
    img.style.transform = `translate(${view.x * s}px, ${view.y * s}px) scale(${view.scale * s})`;
    zoom.value = String(view.scale / minScale(image));
  }

  // Báo "đã căn xong" sau khi người dùng ngừng tay một chút
  function changed() {
    clearTimeout(timer);
    timer = setTimeout(onChange, 200);
  }

  function set(next) {
    view = next;
    draw();
  }

  // Điểm trên màn hình -> toạ độ trong khung
  function toFrame(clientX, clientY) {
    const r = frame.getBoundingClientRect();
    return { x: (clientX - r.left) / k(), y: (clientY - r.top) / k() };
  }

  // ----- Kéo và chụm hai ngón -----
  frame.addEventListener("pointerdown", (e) => {
    if (!image) return;
    frame.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });

  frame.addEventListener("pointermove", (e) => {
    const old = pointers.get(e.pointerId);
    if (!old) return;
    const now = { x: e.clientX, y: e.clientY };
    if (pointers.size === 1) {
      set(moveView(image, view, (now.x - old.x) / k(), (now.y - old.y) / k()));
    } else if (pointers.size === 2) {
      // Hai ngón: phóng theo khoảng cách giữa hai ngón, di theo điểm giữa hai ngón
      const other = [...pointers].find(([id]) => id !== e.pointerId)[1];
      const dist = (a) => Math.hypot(a.x - other.x, a.y - other.y) || 1;
      const mid = (a) => toFrame((a.x + other.x) / 2, (a.y + other.y) / 2);
      const m0 = mid(old);
      const m1 = mid(now);
      const zoomed = zoomView(image, view, (view.scale * dist(now)) / dist(old), m0.x, m0.y);
      set(moveView(image, zoomed, m1.x - m0.x, m1.y - m0.y));
    }
    pointers.set(e.pointerId, now);
  });

  const release = (e) => {
    if (pointers.delete(e.pointerId)) changed();
  };
  frame.addEventListener("pointerup", release);
  frame.addEventListener("pointercancel", release);

  // ----- Con lăn chuột: phóng quanh chỗ con trỏ -----
  frame.addEventListener(
    "wheel",
    (e) => {
      if (!image) return;
      e.preventDefault();
      const p = toFrame(e.clientX, e.clientY);
      set(zoomView(image, view, view.scale * Math.exp(-e.deltaY * 0.0015), p.x, p.y));
      changed();
    },
    { passive: false }
  );

  // ----- Thanh trượt -----
  zoom.min = "1";
  zoom.max = String(MAX_ZOOM);
  zoom.addEventListener("input", () => {
    if (!image) return;
    set(zoomView(image, view, minScale(image) * Number(zoom.value)));
    changed();
  });

  // ----- Bàn phím -----
  frame.addEventListener("keydown", (e) => {
    if (!image) return;
    const step = 20;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) set(moveView(image, view, ...moves[e.key]));
    else if (e.key === "+" || e.key === "=") set(zoomView(image, view, view.scale * 1.1));
    else if (e.key === "-") set(zoomView(image, view, view.scale / 1.1));
    else return;
    e.preventDefault();
    changed();
  });

  // Cỡ khung đổi (xoay điện thoại...) thì vẽ lại
  window.addEventListener("resize", draw);

  return {
    // Mở ảnh từ file người dùng chọn. Khung phải đang hiện (không hidden) để đo được cỡ.
    async load(file) {
      const url = URL.createObjectURL(file);
      try {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error("Trình duyệt không mở được ảnh này. Hãy thử ảnh JPG hoặc PNG."));
          img.src = url;
        });
      } catch (err) {
        URL.revokeObjectURL(url);
        image = null;
        throw err;
      }
      if (img.dataset.url) URL.revokeObjectURL(img.dataset.url); // ảnh cũ không dùng nữa
      img.dataset.url = url;
      image = { w: img.naturalWidth, h: img.naturalHeight };
      img.style.width = `${image.w}px`;
      img.style.height = `${image.h}px`;
      set(startView(image));
    },

    // Phần ảnh trong khung -> JPEG 600 x 900. Trả về { dataUrl, base64 }.
    toJpeg() {
      const canvas = document.createElement("canvas");
      canvas.width = CROP_W;
      canvas.height = CROP_H;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; // ảnh PNG trong suốt -> nền trắng
      ctx.fillRect(0, 0, CROP_W, CROP_H);
      ctx.imageSmoothingQuality = "high";
      const r = cropRect(clampView(image, view));
      ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, CROP_W, CROP_H);
      // Còn nặng quá thì giảm chất lượng dần
      for (let quality = 0.85; quality >= 0.4; quality -= 0.15) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = dataUrl.split(",")[1];
        if (base64Bytes(base64) <= MAX_COVER_BYTES) return { dataUrl, base64 };
      }
      throw new Error("Ảnh vẫn quá nặng sau khi thu nhỏ.");
    },
  };
}
