// ===== หน้าแคตตาล็อกสินค้า (products.html) =====
// Filter: ชื่อ, หมวดหมู่ (multi), ช่วงราคา, เรียงลำดับ

import { db } from "./firebase-config.js";
import { collection, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// ── State ──
let allProducts  = [];
let filteredList = [];       // ผลลัพธ์หลังกรอง+เรียง (ทั้งหมด)
let currentPage  = 1;
const PAGE_SIZE  = 20;       // สินค้าต่อหน้า
let filters = {
  search:     "",
  categories: new Set(),   // ว่าง = ทั้งหมด
  priceMin:   0,
  priceMax:   100000,
  sort:       "name-asc",
};

// ── Elements ──
const grid         = document.getElementById("productGrid");
const emptyMsg     = document.getElementById("emptyMsg");
const searchInput  = document.getElementById("searchInput");
const catListEl    = document.getElementById("catList");
const priceMinEl   = document.getElementById("priceMin");
const priceMaxEl   = document.getElementById("priceMax");
const rangeMinEl   = document.getElementById("rangeMin");
const rangeMaxEl   = document.getElementById("rangeMax");
const rangeFillEl  = document.getElementById("rangeFill");
const priceDisplay = document.getElementById("priceDisplay");
const sortSelect   = document.getElementById("sortSelect");
const resultCount  = document.getElementById("resultCount");
const activeFiltersEl = document.getElementById("activeFilters");
const resetBtn     = document.getElementById("resetBtn");
const paginationEl = document.getElementById("pagination");

// ── โหลดสินค้า ──
const q = query(collection(db, "products"), orderBy("name"));
onSnapshot(q, (snap) => {
  allProducts = snap.empty
    ? []
    : snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // ตั้ง price max จากข้อมูลจริง
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
});

// ── สร้าง category tree ──
function buildCatList() {
  const tree = typeof CATEGORY_TREE !== "undefined" ? CATEGORY_TREE : null;

  if (!tree) {
    // fallback: flat list
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
      // Leaf category (no subs) — acts as direct filter
      const count   = allProducts.filter(p => p.category === group.main).length;
      const checked = filters.categories.has(group.main);
      return `<div class="cat-item ${checked ? "active" : ""}" data-cat="${group.main}">
        <input type="checkbox" ${checked ? "checked" : ""} />
        <label>${group.main}</label>
        <span class="cat-count">${count}</span>
      </div>`;
    }

    const groupCount  = allProducts.filter(p => group.subs.includes(p.category)).length;
    const someActive  = group.subs.some(s => filters.categories.has(s));

    const subsHtml = group.subs.map(sub => {
      const count   = allProducts.filter(p => p.category === sub).length;
      const checked = filters.categories.has(sub);
      return `<div class="cat-item ${checked ? "active" : ""}" data-sub="${sub}">
        <input type="checkbox" ${checked ? "checked" : ""} />
        <label>${sub}</label>
        <span class="cat-count">${count}</span>
      </div>`;
    }).join("");

    return `<div class="cat-group">
      <div class="cat-group-header ${someActive ? "has-active" : ""} ${someActive ? "open" : ""}">
        <span class="cat-group-arrow">›</span>
        <span class="cat-group-name">${group.main}</span>
        <span class="cat-count">${groupCount}</span>
      </div>
      <div class="cat-group-body ${someActive ? "open" : ""}">
        ${subsHtml}
      </div>
    </div>`;
  }).join("");

  // Leaf items
  catListEl.querySelectorAll(".cat-item[data-cat]").forEach(item => {
    item.addEventListener("click", () => {
      const cat = item.dataset.cat;
      if (filters.categories.has(cat)) filters.categories.delete(cat);
      else filters.categories.add(cat);
      buildCatList(); applyFilters();
    });
  });

  // Sub items
  catListEl.querySelectorAll(".cat-item[data-sub]").forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const sub = item.dataset.sub;
      if (filters.categories.has(sub)) filters.categories.delete(sub);
      else filters.categories.add(sub);
      buildCatList(); applyFilters();
    });
  });

  // Group header — expand/collapse
  catListEl.querySelectorAll(".cat-group-header").forEach(header => {
    header.addEventListener("click", () => {
      header.classList.toggle("open");
      header.nextElementSibling.classList.toggle("open");
    });
  });
}

// ── Price range slider ──
function syncRange() {
  let lo = parseInt(rangeMinEl.value);
  let hi = parseInt(rangeMaxEl.value);
  if (lo > hi) { [lo, hi] = [hi, lo]; }

  const max = parseInt(rangeMaxEl.max);
  const pct1 = (lo / max) * 100;
  const pct2 = (hi / max) * 100;
  rangeFillEl.style.left  = pct1 + "%";
  rangeFillEl.style.width = (pct2 - pct1) + "%";

  priceDisplay.textContent = `฿${lo.toLocaleString("th-TH")} – ฿${hi.toLocaleString("th-TH")}`;
  filters.priceMin = lo;
  filters.priceMax = hi;
  priceMinEl.value = lo || "";
  priceMaxEl.value = hi === parseInt(rangeMaxEl.max) ? "" : hi;
}

rangeMinEl.addEventListener("input", () => { syncRange(); applyFilters(); });
rangeMaxEl.addEventListener("input", () => { syncRange(); applyFilters(); });

// Price text input → sync range
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

// ── Search ──
searchInput.addEventListener("input", e => {
  filters.search = e.target.value.trim().toLowerCase();
  applyFilters();
});

// ── Sort ──
sortSelect.addEventListener("change", () => {
  filters.sort = sortSelect.value;
  applyFilters();
});

// ── Reset ──
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

// ── Apply filters & render ──
function applyFilters() {
  let list = allProducts.filter(p => {
    const matchSearch = !filters.search ||
      (p.name || "").toLowerCase().includes(filters.search) ||
      (p.desc || "").toLowerCase().includes(filters.search);

    const matchCat = filters.categories.size === 0 ||
      filters.categories.has(p.category);

    const price = Number(p.price) || 0;
    const matchPrice = price >= filters.priceMin && price <= filters.priceMax;

    return matchSearch && matchCat && matchPrice;
  });

  // Sort
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
  currentPage  = 1;            // กรองใหม่ = กลับไปหน้า 1 เสมอ
  renderChips();
  renderCount(list.length);
  renderPage();
}

// ── แสดงหน้าปัจจุบัน (แบ่งหน้า) ──
function renderPage(scrollUp = false) {
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredList.slice(start, start + PAGE_SIZE);

  renderProducts(pageItems);
  renderPagination(totalPages);

  if (scrollUp) {
    document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function goToPage(n) {
  currentPage = n;
  renderPage(true);
}

// ── ปุ่มแบ่งหน้า (มี prev/next + ... ย่อเมื่อหน้าเยอะ) ──
function renderPagination(totalPages) {
  if (totalPages <= 1) { paginationEl.innerHTML = ""; return; }

  // หาช่วงเลขหน้าที่จะโชว์ (หน้าแรก, หน้าสุดท้าย, และ ±1 รอบหน้าปัจจุบัน)
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

// ── Chips ──
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
    el.addEventListener("click", () => { chips[i].action(); });
  });
}

// ── Count ──
function renderCount(n) {
  resultCount.innerHTML = `พบ <strong>${n}</strong> รายการ`;
}

// ── Render cards ──
function formatPrice(n) {
  return "฿" + Number(n).toLocaleString("th-TH");
}

function renderProducts(list) {
  emptyMsg.hidden = list.length > 0;
  grid.innerHTML = list.map(p => {
    const imgStyle   = p.image ? `style="background-image:url('${p.image}')"` : "";
    const imgContent = p.image ? "" : (p.emoji || "💡");
    const noImg      = p.image ? "" : " no-img";
    const sku = (p.sku || "").replace(/"/g, "&quot;");
    const nm  = (p.name || "").replace(/"/g, "&quot;");
    return `
    <article class="product-card" data-id="${p.id}">
      <div class="product-img${noImg}" ${imgStyle}>${imgContent}</div>
      <div class="product-body">
        <span class="product-cat">${p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        <span class="product-price">${formatPrice(p.price)}</span>
        <button type="button" class="btn-add-quote"
          data-quote-add="${p.id}" data-quote-name="${nm}" data-quote-sku="${sku}">
          ＋ ขอใบเสนอราคา
        </button>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll(".product-card").forEach(card =>
    card.addEventListener("click", () => openModal(card.dataset.id, allProducts)));
}

// ── Modal ──
function openModal(id, list) {
  const p = list.find(x => x.id === id);
  if (!p) return;
  let overlay = document.getElementById("modalOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "modalOverlay";
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);
  }
  const imgStyle   = p.image ? `style="background-image:url('${p.image}')"` : "";
  const imgContent = p.image ? "" : (p.emoji || "💡");
  const noImg      = p.image ? "" : " no-img";
  const sku = (p.sku || "").replace(/"/g, "&quot;");
  const nm  = (p.name || "").replace(/"/g, "&quot;");
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-img${noImg}" ${imgStyle}>${imgContent}</div>
      <div class="modal-info">
        <button class="modal-close" aria-label="ปิด">×</button>
        <span class="product-cat">${p.category}</span>
        <h2>${p.name}</h2>
        <div class="modal-price">${formatPrice(p.price)}</div>
        <p class="modal-desc">${p.desc || ""}</p>
        <button type="button" class="btn-add-quote modal-add-quote"
          data-quote-add="${p.id}" data-quote-name="${nm}" data-quote-sku="${sku}">
          ＋ ขอใบเสนอราคาสินค้านี้
        </button>
      </div>
    </div>`;
  overlay.classList.add("open");
  overlay.querySelector(".modal-close").addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.classList.remove("open"); });
}

// ── Init range fill ──
syncRange();
