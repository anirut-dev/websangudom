// ===== หน้าแคตตาล็อก (index.html) =====
// ดึงสินค้าจาก Firestore real-time — ถ้า Firestore ว่าง ใช้ข้อมูลตัวอย่างแทน

import { db } from "./firebase-config.js";
import { collection, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

let allProducts = [];
let activeCategory = "ทั้งหมด";
let searchTerm = "";

const grid       = document.getElementById("productGrid");
const emptyMsg   = document.getElementById("emptyMsg");
const searchInput = document.getElementById("searchInput");
const filtersEl  = document.getElementById("categoryFilters");

// ===== โหลดสินค้าจาก Firestore =====
const q = query(collection(db, "products"), orderBy("name"));
onSnapshot(q, (snap) => {
  if (snap.empty) {
    // ถ้า Firestore ยังว่าง ใช้ข้อมูลตัวอย่างจาก data.js
    allProducts = typeof SAMPLE_PRODUCTS !== "undefined" ? SAMPLE_PRODUCTS : [];
  } else {
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  renderFilters();
  renderProducts();
});

// ===== ปุ่มหมวดหมู่ =====
function renderFilters() {
  const cats = ["ทั้งหมด", ...CATEGORIES];
  filtersEl.innerHTML = cats.map(c =>
    `<button class="cat-btn ${c === activeCategory ? "active" : ""}" data-cat="${c}">${c}</button>`
  ).join("");
  filtersEl.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderFilters();
      renderProducts();
    });
  });
}

function formatPrice(n) {
  return "฿" + Number(n).toLocaleString("th-TH");
}

// ===== แสดงสินค้า =====
function renderProducts() {
  const list = allProducts.filter(p => {
    const matchCat    = activeCategory === "ทั้งหมด" || p.category === activeCategory;
    const matchSearch = !searchTerm ||
      p.name.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm);
    return matchCat && matchSearch;
  });

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
    card.addEventListener("click", () => openModal(card.dataset.id)));
}

// ===== Modal รายละเอียด =====
function openModal(id) {
  const p = allProducts.find(x => x.id === id);
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
  overlay.querySelector(".modal-close").addEventListener("click", closeModal);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
}
function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.classList.remove("open");
}

// ===== ค้นหา =====
if (searchInput) {
  searchInput.addEventListener("input", e => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderProducts();
  });
}

// ===== เมนูมือถือ =====
const navToggle = document.getElementById("navToggle");
const mainNav   = document.getElementById("mainNav");
if (navToggle) navToggle.addEventListener("click", () => mainNav.classList.toggle("open"));
