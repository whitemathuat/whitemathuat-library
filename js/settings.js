// Cài đặt chung của thư viện (dùng ở trang sách và trang Cài đặt).
// Cài đặt thật nằm trong file settings.json ở gốc trang web (lưu trên GitHub, mọi máy dùng chung).
// Máy này còn giữ một bản sao trong trình duyệt (localStorage) để:
//   - trang mở ra là áp dụng ngay, không phải chờ tải settings.json;
//   - vừa bấm đổi ở trang Cài đặt thì máy này đổi ngay, dù settings.json trên mạng
//     còn cũ thêm 1–2 phút (bản vừa bấm được ưu tiên trong 10 phút, gọi là "đang chờ").
// Script thường (không phải module) để mở trực tiếp file trên máy vẫn chạy.
(function () {
  var KEY = "library-settings";
  var PENDING_MS = 10 * 60 * 1000; // bản vừa bấm thắng settings.json cũ trong 10 phút
  var DEFAULTS = { show_location: true };

  // Chỉ giữ cài đặt biết tên và đúng kiểu; thiếu thì lấy mặc định.
  function clean(raw) {
    var out = {};
    for (var key in DEFAULTS) {
      out[key] = raw && typeof raw[key] === typeof DEFAULTS[key] ? raw[key] : DEFAULTS[key];
    }
    return out;
  }

  function same(a, b) {
    return JSON.stringify(clean(a)) === JSON.stringify(clean(b));
  }

  // Chọn cài đặt dùng: local = bản sao trong máy { settings, at, pending }, fetched = settings.json (null nếu không tải được).
  // Trả về bản sao mới để lưu lại.
  function choose(local, fetched, now) {
    if (!fetched) return local || { settings: clean(null), at: 0, pending: false };
    if (local && local.pending && now - local.at < PENDING_MS && !same(local.settings, fetched)) return local;
    return { settings: clean(fetched), at: now, pending: false };
  }

  function readLocal() {
    try {
      var rec = JSON.parse(localStorage.getItem(KEY));
      return rec && rec.settings ? { settings: clean(rec.settings), at: Number(rec.at) || 0, pending: !!rec.pending } : null;
    } catch (e) {
      return null; // trình duyệt chặn hoặc dữ liệu hỏng: coi như chưa có
    }
  }

  function writeLocal(rec) {
    try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) { /* chặn thì thôi */ }
  }

  // Áp dụng cài đặt: gọi onChange ngay với bản trong máy, rồi gọi lại nếu settings.json khác.
  // prefix = đường từ trang về gốc ("../../" ở trang sách, "../" ở trang Cài đặt).
  function load(prefix, onChange) {
    var local = readLocal();
    var shown = local ? local.settings : clean(null);
    onChange(shown);
    if (typeof fetch !== "function") return;
    fetch(prefix + "settings.json", { cache: "no-store" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; }) // mở file trên máy (file://): không tải được
      .then(function (fetched) {
        var rec = choose(readLocal(), fetched, Date.now());
        if (fetched) writeLocal(rec);
        if (!same(rec.settings, shown)) onChange(rec.settings);
      });
  }

  // Trang Cài đặt vừa đổi: ghi vào máy này ngay (đánh dấu "đang chờ" mạng cập nhật).
  function remember(settings, pending) {
    writeLocal({ settings: clean(settings), at: Date.now(), pending: pending });
  }

  window.LibrarySettings = { DEFAULTS: DEFAULTS, clean: clean, choose: choose, load: load, remember: remember, readLocal: readLocal };
})();
