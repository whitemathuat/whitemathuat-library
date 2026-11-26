// Trang từng cuốn sách (novels/<sách>/index.html): ẩn/hiện dòng vị trí ("Loc 343" / "Trang 7")
// theo cài đặt chung "Hiện vị trí highlight" (trang Cài đặt, file settings.json, js/settings.js).
// Ẩn = thêm class "hide-loc" ở khung ghi chú, CSS sẽ giấu các dòng .loc.
// Script thường (không phải module) để mở trực tiếp file trên máy vẫn chạy.
(function () {
  var panel = document.getElementById("tab-notes");
  if (!panel || !window.LibrarySettings) return;
  try { localStorage.removeItem("show-location"); } catch (e) { /* lựa chọn cũ của nút "Ẩn vị trí" (đã bỏ) */ }
  window.LibrarySettings.load("../../", function (settings) {
    panel.classList.toggle("hide-loc", !settings.show_location);
  });
})();
