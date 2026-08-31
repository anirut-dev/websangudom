// ===== สินค้าที่ดูล่าสุด (หน้าแรก) =====
// อ่านรายการ SKU จาก localStorage (เก็บโดย js/products.js ตอนเปิด modal สินค้า)
// ถ้าไม่มีประวัติ ไม่แสดง section เลย
(function () {
  const RECENT_KEY = "sangudom-recently-viewed";
  const section = document.getElementById("recentlyViewedSection");
  const grid    = document.getElementById("recentlyViewedGrid");
  if (!section || !grid) return;

  let skus = [];
  try { skus = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch (e) { skus = []; }
  if (!skus.length) return;

  fetch("data/products.json")
    .then(res => res.json())
    .then(products => {
      const bySku = new Map(products.map(p => [p.sku, p]));
      const list  = skus.map(sku => bySku.get(sku)).filter(Boolean).slice(0, 6);
      if (!list.length) return;

      grid.innerHTML = list.map(p => {
        const noImgCls = p.image ? "" : " no-img";
        const imgTag   = p.image
          ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="400" height="400" />`
          : "";
        return `
        <a class="product-card" href="products.html?sku=${encodeURIComponent(p.sku)}">
          <div class="product-img${noImgCls}">${badgeHtml(p)}${imgTag}</div>
          <div class="product-body">
            <span class="product-cat">${esc(p.category)}</span>
            <h3 class="product-name">${esc(p.name)}</h3>
            ${priceHtml(p)}
          </div>
        </a>`;
      }).join("");

      section.hidden = false;
    })
    .catch(() => {});

  function priceHtml(p) {
    const regular = "฿" + Number(p.price).toLocaleString("th-TH");
    if (!p.priceSale) return `<span class="product-price">${regular}</span>`;
    const sale = "฿" + Number(p.priceSale).toLocaleString("th-TH");
    return `<span class="product-price">
      <span class="price-sale">${sale}</span>
      <span class="price-original">${regular}</span>
    </span>`;
  }

  function badgeHtml(p) {
    if (!p.badge) return "";
    const cls = p.badge === "ใหม่" ? "badge-new" : p.badge === "โปรโมชั่น" ? "badge-sale" : "";
    return `<span class="product-badge ${cls}">${esc(p.badge)}</span>`;
  }

  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
})();
