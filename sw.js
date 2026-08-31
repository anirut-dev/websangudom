// ===== Service Worker — แคชพื้นฐานให้เปิดเว็บได้แม้เน็ตหลุด/ช้า =====
// กลยุทธ์:
//   - app shell (html/css/js/icons หลัก) → cache-first เร็ว
//   - data/products.json → network-first กันราคาสินค้าเก่าค้าง แต่ยังเปิดได้ตอนออฟไลน์
//   - อย่างอื่น (รูปสินค้า ฯลฯ) → cache-first แบบ opportunistic (เจอครั้งแรกค่อยแคช)
const CACHE_NAME = "sangudom-v1";
// path relative กับตำแหน่งของ sw.js เอง (self.registration.scope) — ห้าม hardcode "/"
// เพราะเว็บนี้ยัง deploy อยู่ที่ subpath (github.io/websangudom/) รอซื้อโดเมนถึงจะย้ายไป root
const APP_SHELL = [
  "./",
  "index.html",
  "products.html",
  "about.html",
  "branches.html",
  "gallery.html",
  "css/style.css",
  "js/animations.js",
  "js/data.js",
  "js/line-float.js",
  "js/products.js",
  "js/recently-viewed.js",
  "js/theme.js",
  "js/pwa.js",
  "manifest.json",
  "images/icons/icon-192.png",
  "images/icons/icon-512.png",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL.map(p => new URL(p, self.registration.scope).href)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return; // ปล่อยผ่าน third-party (fonts, LINE ฯลฯ)

  if (url.pathname.endsWith("/data/products.json")) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, res.clone());
    }
    return res;
  } catch (e) {
    return cached || Response.error();
  }
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, res.clone());
    }
    return res;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw e;
  }
}
