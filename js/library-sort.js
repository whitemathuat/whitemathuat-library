// Nút "Mới thêm" / "A → Z" ở trang thư viện (books/index.html).
// Thứ tự đã được tính sẵn lúc dựng trang (tools/build_library.js): mỗi thẻ sách có
// data-new (vị trí khi xếp "Mới thêm") và data-az (vị trí khi xếp theo tên).
// Ở đây chỉ việc xếp lại các thẻ theo số đó; kệ "Sắp có" luôn ở cuối.
// Script thường (không phải module) để mở trực tiếp file trên máy vẫn chạy.
(function () {
  var KEY = "library-sort"; // máy này nhớ kiểu xếp đã chọn
  var grid = document.getElementById("book-grid");
  var buttons = document.querySelectorAll(".sort button");
  if (!grid || !buttons.length) return;

  function apply(mode) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".card[data-new]"));
    cards.sort(function (a, b) {
      return Number(a.dataset[mode]) - Number(b.dataset[mode]);
    });
    var firstSoon = grid.querySelector(".card.soon"); // thẻ sách đứng trước các kệ "Sắp có"
    cards.forEach(function (card) {
      grid.insertBefore(card, firstSoon);
    });
    buttons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.sort === mode));
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      apply(btn.dataset.sort);
      try { localStorage.setItem(KEY, btn.dataset.sort); } catch (e) { /* trình duyệt chặn thì thôi */ }
    });
  });

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* không đọc được thì dùng mặc định */ }
  if (saved === "az") apply("az");
})();
