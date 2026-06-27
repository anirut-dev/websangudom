// ===== หน้าแคตตาล็อกสินค้า (products.html) =====
// Filter: ชื่อ, หมวดหมู่ (multi), ช่วงราคา, เรียงลำดับ

import { db } from "./firebase-config.js";
import { collection, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// ── State ──
let allProducts  = [];
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

// ── โหลดสินค้า ──
const q = query(collection(db, "products"), orderBy("name"));
onSnapshot(q, (snap) => {
  allProducts = snap.empty
    ? (typeof SAMPLE_PRODUCTS !== "undefined" ? SAMPLE_PRODUCTS : [])
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

// ── สร้าง checkbox หมวดหมู่ ──
function buildCatList() {
  const cats = typeof CATEGORIES !== "undefined" ? CATEGORIES : [...new Set(allProducts.map(p => p.category))];
  catListEl.innerHTML = cats.map(c => {
    const count   = allProducts.filter(p => p.category === c).length;
    const checked = filters.categories.has(c);
    return `
      <div class="cat-item ${checked ? "active" : ""}" data-cat="${c}">
        <input type="checkbox" id="cat_${c}" ${checked ? "checked" : ""} />
        <label for="cat_${c}">${c}</label>
        <span class="cat-count">${count}</span>
      </div>`;
  }).join("");

  catListEl.querySelectorAll(".cat-item").forEach(item => {
    item.addEventListener("click", (e) => {
      const cat = item.dataset.cat;
      if (filters.categories.has(cat)) filters.categories.delete(cat);
      else filters.categories.add(cat);
      buildCatList();
      applyFilters();
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

  renderChips();
  renderCount(list.length);
  renderProducts(list);
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
    return `
    <article class="product-card" data-id="${p.id}">
      <div class="product-img" ${imgStyle}>${imgContent}</div>
      <div class="product-body">
        <span class="product-cat">${p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        <span class="product-price">${formatPrice(p.price)}</span>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll(".product-card").forEach(card =>
    card.addEventListener("click", () => openModal(card.dataset.id, list)));
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
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-img" ${imgStyle}>${imgContent}</div>
      <div class="modal-info">
        <button class="modal-close" aria-label="ปิด">×</button>
        <span class="product-cat">${p.category}</span>
        <h2>${p.name}</h2>
        <div class="modal-price">${formatPrice(p.price)}</div>
        <p class="modal-desc">${p.desc || ""}</p>
      </div>
    </div>`;
  overlay.classList.add("open");
  overlay.querySelector(".modal-close").addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.classList.remove("open"); });
}

// ── Init range fill ──
syncRange();
