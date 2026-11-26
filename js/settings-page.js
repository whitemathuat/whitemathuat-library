// Trang "Cài đặt" (settings/index.html): mỗi công tắc (button.switch, data-key = tên cài đặt)
// bật/tắt một cài đặt chung. Bấm = máy này đổi ngay + gửi lên /api/save-settings
// (functions/api/save-settings.js) để lưu settings.json trên GitHub cho mọi máy.
// Lưu không được thì công tắc quay về như cũ và báo lỗi.
// Dùng chung js/settings.js (đọc settings.json, bản sao trong máy).
(function () {
  var S = window.LibrarySettings;
  var switches = document.querySelectorAll(".switch[data-key]");
  var message = document.getElementById("message");
  var current = S.clean(null);

  function show(settings) {
    current = S.clean(settings);
    switches.forEach(function (sw) {
      sw.setAttribute("aria-checked", String(current[sw.dataset.key]));
    });
  }

  function say(text, kind) {
    message.textContent = text;
    message.className = "message " + (kind || "");
  }

  function setBusy(busy) {
    switches.forEach(function (sw) { sw.disabled = busy; });
  }

  switches.forEach(function (sw) {
    sw.addEventListener("click", function () {
      var before = current;
      var next = S.clean(before);
      next[sw.dataset.key] = !before[sw.dataset.key];
      show(next);
      S.remember(next, true); // máy này đổi ngay (đang chờ mạng cập nhật)
      setBusy(true);
      say("Đang lưu…");
      fetch("../api/save-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (reply) {
            if (!res.ok || !reply.ok) throw new Error(reply.message || "Máy chủ trả lỗi " + res.status);
            say(reply.message, "ok");
          });
        })
        .catch(function (err) {
          // Không lưu được (mất mạng, mở file trên máy...): trả công tắc về như cũ
          show(before);
          S.remember(before, false);
          var offline = location.protocol === "file:" ? "chỉ lưu được trên trang web online" : err.message;
          say("Chưa lưu được: " + offline, "error");
        })
        .then(function () { setBusy(false); });
    });
  });

  S.load("../", show);
})();
