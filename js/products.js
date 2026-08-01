// ===== หน้าแคตตาล็อกสินค้า (products.html) — v2 static =====
// โหลดจาก data/products.json (ไม่มี Firebase)
// Filter: ชื่อ, หมวดหมู่ (multi), ช่วงราคา, เรียงลำดับ

const LINE_URL = "https://line.me/ti/p/~Sangudom-sale";

// ── State ──
let allProducts  = [];
let filteredList = [];
let currentPage  = 1;
const PAGE_SIZE  = 20;
let filters = {
  search:     "",
  categories: new Set(),
  priceMin:   0,
  priceMax:   100000,
  sort:       "name-asc",
};

// ── Elements ──
const grid            = document.getElementById("productGrid");
const emptyMsg        = document.getElementById("emptyMsg");
const searchInput     = document.getElementById("searchInput");
const catListEl       = document.getElementById("catList");
const priceMinEl      = document.getElementById("priceMin");
const priceMaxEl      = document.getElementById("priceMax");
const rangeMinEl      = document.getElementById("rangeMin");
const rangeMaxEl      = document.getElementById("rangeMax");
const rangeFillEl     = document.getElementById("rangeFill");
const priceDisplay    = document.getElementById("priceDisplay");
const sortSelect      = document.getElementById("sortSelect");
const resultCount     = document.getElementById("resultCount");
const activeFiltersEl = document.getElementById("activeFilters");
const resetBtn        = document.getElementById("resetBtn");
const paginationEl    = document.getElementById("pagination");

// ── โหลดสินค้าจาก JSON ──────────────────────────────────────────────────────
async function loadProducts() {
  try {
    const res  = await fetch("data/products.json");
    const data = await res.json();
    initProducts(data);
  } catch (e) {
    console.error("โหลดสินค้าไม่ได้:", e);
    allProducts = [];
    buildCatList();
    applyFilters();
  }
}
loadProducts();

// ── อ่าน ?cat= จาก URL ────────────────────────────────────────────────────────
// รับได้ทั้งชื่อกลุ่มใหญ่ (Exterior Lamp) และชื่อหมวดจริง
// คั่นหลายค่าด้วย comma เช่น ?cat=LED,Solar cell
function applyCatFromUrl() {
  const raw = new URLSearchParams(location.search).get("cat");
  if (!raw) return;
  const tree = typeof CATEGORY_TREE !== "undefined" ? CATEGORY_TREE : [];
  const known = new Set(allProducts.map(p => p.category));

  for (const token of raw.split(",").map(s => s.trim()).filter(Boolean)) {
    const group = tree.find(g => g.main === token);
    if (group) {
      // กลุ่มใหญ่ที่ไม่มีหมวดย่อย (เช่น Solar cell) ตัวมันเองคือหมวดจริง
      const targets = group.subs.length ? group.subs : [group.main];
      targets.forEach(c => filters.categories.add(c));
    } else if (known.has(token)) {
      filters.categories.add(token);
    }
  }
}

// ── ตั้ง state + price ceiling + render ──
function initProducts(list) {
  allProducts = list;
  applyCatFromUrl();
  const maxPrice = Math.max(...allProducts.map(p => p.price || 0), 0);
  const ceiling  = Math.ceil(maxPrice / 1000) * 1000 || 100000;
  rangeMaxEl.max = ceiling;
  rangeMinEl.max = ceiling;
  if (filters.priceMax === 100000) {
    filters.priceMax = ceiling;
    rangeMaxEl.value = ceiling;
    priceMaxEl.placeholder = ceiling.toLocaleString("th-TH");
  }
  buildCatList();
  applyFilters();
}

// ── Category tree ────────────────────────────────────────────────────────────
function buildCatList() {
  const tree = typeof CATEGORY_TREE !== "undefined" ? CATEGORY_TREE : null;

  if (!tree) {
    const cats = [...new Set(allProducts.map(p => p.category))].sort();
    catListEl.innerHTML = cats.map(c => {
      const count   = allProducts.filter(p => p.category === c).length;
      const checked = filters.categories.has(c);
      return `<div class="cat-item ${checked ? "active" : ""}" data-cat="${c}">
        <input type="checkbox" ${checked ? "checked" : ""} />
        <label>${c}</label>
        <span class="cat-count">${count}</span>
      </div>`;
    }).join("");
    catListEl.querySelectorAll(".cat-item").forEach(item => {
      item.addEventListener("click", () => {
        const cat = item.dataset.cat;
        if (filters.categories.has(cat)) filters.categories.delete(cat);
        else filters.categories.add(cat);
        buildCatList(); applyFilters();
      });
    });
    return;
  }

  catListEl.innerHTML = tree.map(group => {
    if (group.subs.length === 0) {
      const count   = allProducts.filter(p => p.category === group.main).length;
      const checked = filters.categories.has(group.main);
      return `<div class="cat-item ${checked ? "active" : ""}" data-cat="${group.main}">
        <input type="checkbox" ${checked ? "checked" : ""} />
        <label>${group.main}</label>
        <span class="cat-count">${count}</span>
      </div>`;
    }
    const groupCount = allProducts.filter(p => group.subs.includes(p.category)).length;
    const someActive = group.subs.some(s => filters.categories.has(s));
    const subsHtml   = group.subs.map(sub => {
      const count   = allProducts.filter(p => p.category === sub).length;
      const checked = filters.categories.has(sub);
      return `<div class="cat-item ${checked ? "active" : ""}" data-sub="${sub}">
        <input type="checkbox" ${checked ? "checked" : ""} />
        <label>${sub}</label>
        <span class="cat-count">${count}</span>
      </div>`;
    }).join("");
    return `<div class="cat-group">
      <div class="cat-group-header ${someActive ? "has-active open" : ""}">
        <span class="cat-group-arrow">›</span>
        <span class="cat-group-name">${group.main}</span>
        <span class="cat-count">${groupCount}</span>
      </div>
      <div class="cat-group-body ${someActive ? "open" : ""}">
        ${subsHtml}
      </div>
    </div>`;
  }).join("");

  catListEl.querySelectorAll(".cat-item[data-cat]").forEach(item => {
    item.addEventListener("click", () => {
      const cat = item.dataset.cat;
      if (filters.categories.has(cat)) filters.categories.delete(cat);
      else filters.categories.add(cat);
      buildCatList(); applyFilters();
    });
  });
  catListEl.querySelectorAll(".cat-item[data-sub]").forEach(item => {
    item.addEventListener("click", e => {
      e.stopPropagation();
      const sub = item.dataset.sub;
      if (filters.categories.has(sub)) filters.categories.delete(sub);
      else filters.categories.add(sub);
      buildCatList(); applyFilters();
    });
  });
  catListEl.querySelectorAll(".cat-group-header").forEach(header => {
    header.addEventListener("click", () => {
      header.classList.toggle("open");
      header.nextElementSibling.classList.toggle("open");
    });
  });
}

// ── Price range slider ────────────────────────────────────────────────────────
function syncRange() {
  let lo = parseInt(rangeMinEl.value);
  let hi = parseInt(rangeMaxEl.value);
  if (lo > hi) [lo, hi] = [hi, lo];
  const max  = parseInt(rangeMaxEl.max);
  const pct1 = (lo / max) * 100;
  const pct2 = (hi / max) * 100;
  rangeFillEl.style.left  = pct1 + "%";
  rangeFillEl.style.width = (pct2 - pct1) + "%";
  priceDisplay.textContent = `฿${lo.toLocaleString("th-TH")} – ฿${hi.toLocaleString("th-TH")}`;
  filters.priceMin = lo;
  filters.priceMax = hi;
  priceMinEl.value = lo || "";
  priceMaxEl.value = hi === max ? "" : hi;
}
rangeMinEl.addEventListener("input", () => { syncRange(); applyFilters(); });
rangeMaxEl.addEventListener("input", () => { syncRange(); applyFilters(); });

function syncFromInput() {
  const lo = parseInt(priceMinEl.value) || 0;
  const hi = parseInt(priceMaxEl.value) || parseInt(rangeMaxEl.max);
  rangeMinEl.value = lo;
  rangeMaxEl.value = hi;
  syncRange();
  applyFilters();
}
priceMinEl.addEventListener("change", syncFromInput);
priceMaxEl.addEventListener("change", syncFromInput);

// ── Search ────────────────────────────────────────────────────────────────────
searchInput.addEventListener("input", e => {
  filters.search = e.target.value.trim().toLowerCase();
  applyFilters();
});

// ── Sort ─────────────────────────────────────────────────────────────────────
sortSelect.addEventListener("change", () => {
  filters.sort = sortSelect.value;
  applyFilters();
});

// ── Reset ─────────────────────────────────────────────────────────────────────
resetBtn.addEventListener("click", () => {
  filters.search = "";
  filters.categories.clear();
  filters.priceMin = 0;
  filters.priceMax = parseInt(rangeMaxEl.max);
  filters.sort = "name-asc";
  searchInput.value  = "";
  priceMinEl.value   = "";
  priceMaxEl.value   = "";
  rangeMinEl.value   = 0;
  rangeMaxEl.value   = rangeMaxEl.max;
  sortSelect.value   = "name-asc";
  syncRange();
  buildCatList();
  applyFilters();
});

// ── Apply filters & render ────────────────────────────────────────────────────
function applyFilters() {
  let list = allProducts.filter(p => {
    const matchSearch = !filters.search ||
      (p.name || "").toLowerCase().includes(filters.search) ||
      (p.sku  || "").toLowerCase().includes(filters.search);
    const matchCat = filters.categories.size === 0 ||
      filters.categories.has(p.category);
    const price      = Number(p.price) || 0;
    const matchPrice = price >= filters.priceMin && price <= filters.priceMax;
    return matchSearch && matchCat && matchPrice;
  });

  list = list.sort((a, b) => {
    switch (filters.sort) {
      case "name-asc":   return (a.name || "").localeCompare(b.name || "", "th");
      case "name-desc":  return (b.name || "").localeCompare(a.name || "", "th");
      case "price-asc":  return (a.price || 0) - (b.price || 0);
      case "price-desc": return (b.price || 0) - (a.price || 0);
      default: return 0;
    }
  });

  filteredList = list;
  currentPage  = 1;
  renderChips();
  renderCount(list.length);
  renderPage();
}

// ── Pagination ────────────────────────────────────────────────────────────────
function renderPage(scrollUp = false) {
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start     = (currentPage - 1) * PAGE_SIZE;
  renderProducts(filteredList.slice(start, start + PAGE_SIZE));
  renderPagination(totalPages);
  if (scrollUp) {
    document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
function goToPage(n) { currentPage = n; renderPage(true); }

function renderPagination(totalPages) {
  if (totalPages <= 1) { paginationEl.innerHTML = ""; return; }
  const pages = [];
  const push = v => { if (!pages.includes(v)) pages.push(v); };
  push(1);
  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
    if (i > 1 && i < totalPages) push(i);
  }
  push(totalPages);
  pages.sort((a, b) => a - b);
  let html = `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="ก่อนหน้า">‹</button>`;
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) html += `<span class="page-ellipsis">…</span>`;
    html += `<button class="page-btn ${p === currentPage ? "active" : ""}" data-page="${p}">${p}</button>`;
    prev = p;
  }
  html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} aria-label="ถัดไป">›</button>`;
  paginationEl.innerHTML = html;
  paginationEl.querySelectorAll(".page-btn[data-page]").forEach(btn => {
    btn.addEventListener("click", () => {
      const n = parseInt(btn.dataset.page);
      if (!btn.disabled && n >= 1 && n <= totalPages && n !== currentPage) goToPage(n);
    });
  });
}

// ── Chips ─────────────────────────────────────────────────────────────────────
function renderChips() {
  const chips = [];
  if (filters.search) {
    chips.push({ label: `"${filters.search}"`, action: () => {
      filters.search = ""; searchInput.value = ""; applyFilters();
    }});
  }
  filters.categories.forEach(c => {
    chips.push({ label: c, action: () => {
      filters.categories.delete(c); buildCatList(); applyFilters();
    }});
  });
  const maxP = parseInt(rangeMaxEl.max);
  if (filters.priceMin > 0 || filters.priceMax < maxP) {
    chips.push({ label: `฿${filters.priceMin.toLocaleString()} – ฿${filters.priceMax.toLocaleString()}`, action: () => {
      filters.priceMin = 0; filters.priceMax = maxP;
      rangeMinEl.value = 0; rangeMaxEl.value = maxP;
      priceMinEl.value = ""; priceMaxEl.value = "";
      syncRange(); applyFilters();
    }});
  }
  activeFiltersEl.innerHTML = chips.map((ch, i) =>
    `<span class="filter-chip" data-i="${i}">${ch.label} <span class="x">×</span></span>`
  ).join("");
  activeFiltersEl.querySelectorAll(".filter-chip").forEach((el, i) => {
    el.addEventListener("click", () => chips[i].action());
  });
}

// ── Count ─────────────────────────────────────────────────────────────────────
function renderCount(n) {
  resultCount.innerHTML = `พบ <strong>${n}</strong> รายการ`;
}

// ── Format price ──────────────────────────────────────────────────────────────
function priceHtml(p) {
  const regular = "฿" + Number(p.price).toLocaleString("th-TH");
  if (!p.priceSale) return `<span class="product-price">${regular}</span>`;
  const sale = "฿" + Number(p.priceSale).toLocaleString("th-TH");
  return `<span class="product-price">
    <span class="price-sale">${sale}</span>
    <span class="price-original">${regular}</span>
  </span>`;
}

// ── Escape สำหรับใส่ใน attribute/HTML ─────────────────────────────────────────
function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Product cards ─────────────────────────────────────────────────────────────
function renderProducts(list) {
  emptyMsg.hidden = list.length > 0;
  grid.innerHTML = list.map(p => {
    const sku      = esc(p.sku);
    const noImgCls = p.image ? "" : " no-img";
    const imgTag   = p.image
      ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="400" height="400" />`
      : "";
    return `
    <article class="product-card" data-sku="${sku}" role="button" tabindex="0"
             aria-label="ดูรายละเอียด ${esc(p.name)}">
      <div class="product-img${noImgCls}">${imgTag}</div>
      <div class="product-body">
        <span class="product-cat">${esc(p.category)}</span>
        <h3 class="product-name">${esc(p.name)}</h3>
        ${priceHtml(p)}
      </div>
    </article>`;
  }).join("");
  grid.querySelectorAll(".product-card").forEach(card => {
    const open = () => openModal(card.dataset.sku);
    card.addEventListener("click", open);
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(sku) {
  const p = allProducts.find(x => x.sku === sku);
  if (!p) return;

  let overlay = document.getElementById("modalOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "modalOverlay";
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);
  }

  const noImgCls = p.image ? "" : " no-img";
  const imgTag   = p.image
    ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" width="600" height="600" />`
    : "";

  let priceBlock = "";
  if (p.priceSale) {
    priceBlock = `<div class="modal-price">
      <span class="price-sale">${"฿" + Number(p.priceSale).toLocaleString("th-TH")}</span>
      <span class="modal-price-original">${"฿" + Number(p.price).toLocaleString("th-TH")}</span>
    </div>`;
  } else {
    priceBlock = `<div class="modal-price">${"฿" + Number(p.price).toLocaleString("th-TH")}</div>`;
  }

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-img${noImgCls}">${imgTag}</div>
      <div class="modal-info">
        <button class="modal-close" aria-label="ปิด">×</button>
        <span class="product-cat">${esc(p.category)}</span>
        <h2>${esc(p.name)}</h2>
        ${p.skuAuto ? "" : `<div class="product-sku-label">รหัสสินค้า: ${esc(p.sku)}</div>`}
        ${priceBlock}
        <a class="btn-line-inquiry" href="${LINE_URL}" target="_blank" rel="noopener noreferrer">
          <span class="line-ico">💬</span> สอบถามราคาทาง LINE
        </a>
      </div>
    </div>`;

  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
  overlay.querySelector(".modal-close").addEventListener("click", closeModal);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
}

function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}

// Close modal on Escape
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

// ── Init range fill ───────────────────────────────────────────────────────────
syncRange();
