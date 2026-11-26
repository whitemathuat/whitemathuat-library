// Nút "Ẩn vị trí" / "Hiện vị trí" trên trang từng cuốn sách (novels/<sách>/index.html).
// Bấm nút: thêm/bỏ class "hide-loc" ở khung ghi chú, CSS sẽ ẩn các dòng "Loc 343" / "Trang 7".
// Máy này nhớ lựa chọn cho mọi cuốn sách. Mặc định: hiện vị trí.
// Script thường (không phải module) để mở trực tiếp file trên máy vẫn chạy.
(function () {
  var KEY = "show-location"; // "no" = đang ẩn vị trí
  var panel = document.getElementById("tab-notes");
  var button = document.getElementById("loc-toggle");
  if (!panel || !button) return;

  function apply(show) {
    panel.classList.toggle("hide-loc", !show);
    button.textContent = show ? "Ẩn vị trí" : "Hiện vị trí";
    button.setAttribute("aria-pressed", String(show));
  }

  button.addEventListener("click", function () {
    var show = panel.classList.contains("hide-loc"); // đang ẩn -> bấm để hiện
    apply(show);
    try { localStorage.setItem(KEY, show ? "yes" : "no"); } catch (e) { /* trình duyệt chặn thì thôi */ }
  });

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* không đọc được thì dùng mặc định */ }
  apply(saved !== "no");
})();
