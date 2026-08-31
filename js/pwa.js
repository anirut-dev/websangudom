// ลงทะเบียน Service Worker — เปิดเว็บได้แม้เน็ตหลุด/ช้า และติดตั้งเป็นแอปบนมือถือได้ (PWA)
// sw.js อยู่ที่ root เสมอ ไม่ว่าไฟล์นี้จะถูกโหลดจากหน้าลึกแค่ไหน (เช่น products/<slug>/)
// ต้องคำนวณ path จาก location ของสคริปต์นี้เอง (document.currentScript ต้องอ่าน "ตอนนี้" เท่านั้น
// อ่านช้าไปใน callback ข้างล่างจะได้ null เพราะสคริปต์รันจบไปแล้ว) — ไม่ hardcode "/sw.js"
// เพราะเว็บนี้ยัง deploy อยู่ที่ subpath (github.io/websangudom/) รอซื้อโดเมนถึงจะย้ายไป root
const swUrl = new URL("../sw.js", document.currentScript.src).href;
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}
