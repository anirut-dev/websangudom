// Floating LINE button — สร้างและ inject เข้า body ทุกหน้า
(function () {
  const LINE_URL = "https://line.me/ti/p/~Sangudom-sale";
  const a = document.createElement("a");
  a.className = "line-float";
  a.href = LINE_URL;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.setAttribute("aria-label", "สอบถามทาง LINE");
  a.innerHTML = '<span aria-hidden="true">💬</span> LINE';
  document.body.appendChild(a);
})();
