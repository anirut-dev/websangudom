/* js/theme.js — ปุ่มสลับโหมดมืด/สว่าง
   ค่าที่เลือกเก็บใน localStorage (ที่เก็บข้อมูลในเบราว์เซอร์) จะจำข้ามหน้าและข้ามวัน
   ส่วนที่กันจอกระพริบตอนโหลด อยู่ใน <script> สั้นๆ ใน <head> ของแต่ละหน้า */
(function () {
  var KEY  = "sangudom-theme";
  var root = document.documentElement;
  var btn  = document.getElementById("themeToggle");
  if (!btn) return;

  function sync(theme) {
    var isDark = theme === "dark";
    var text   = isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด";
    btn.setAttribute("aria-label", text);
    btn.setAttribute("title", text);
    btn.setAttribute("aria-pressed", String(isDark));
  }

  sync(root.getAttribute("data-theme"));

  btn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch (e) { /* โหมดส่วนตัว/บล็อก storage */ }
    sync(next);
  });
})();
