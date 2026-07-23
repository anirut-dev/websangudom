// ===== หน้าแคตตาล็อก (index.html) =====
// ดึงสินค้าจาก Firestore server-side — pagination, filtering, performance optimized

import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getProductsWithFilters, getCategories, ProductPagination } from "./firestore-queries.js";

let allCategories = [];
let activeCategory = "ทั้งหมด";
let searchTerm = "";
let pagination = new ProductPagination(20);
let isLoading = false;

const grid       = document.getElementById("productGrid");
const emptyMsg   = document.getElementById("emptyMsg");
const searchInput = document.getElementById("searchInput");
const filtersEl  = document.getElementById("categoryFilters");
const loadMoreBtn = document.getElementById("loadMoreBtn");

// ===== โหลดหมวดหมู่ =====
async function loadCategories() {
  try {
    allCategories = await getCategories();
    renderFilters();
  } catch (error) {
    console.error("Error loading categories:", error);
    allCategories = [];
  }
}

// ===== โหลดสินค้าจาก Firestore (server-side) =====
async function loadProducts(isLoadMore = false) {
  if (isLoading) return;

  try {
    isLoading = true;

    // Reset pagination if not loading more
    if (!isLoadMore) {
      pagination.reset();
    }

    const result = await getProductsWithFilters(
      activeCategory,
      searchTerm,
      pagination.pageSize,
      pagination.lastDoc
    );

    if (!isLoadMore) {
      grid.innerHTML = "";
    }

    if (result.products.length === 0 && !isLoadMore) {
      emptyMsg.hidden = false;
      loadMoreBtn.hidden = true;
    } else {
      emptyMsg.hidden = true;
      pagination.currentPage = result.products;
      pagination.lastDoc = result.lastDoc;
      pagination.hasMore = result.hasMore;

      renderProducts();
      loadMoreBtn.hidden = !pagination.hasMore;
    }
  } catch (error) {
    console.error("Error loading products:", error);
    emptyMsg.hidden = false;
    loadMoreBtn.hidden = true;
  } finally {
    isLoading = false;
  }
}

// Initial load
loadCategories();
loadProducts();

// ===== ปุ่มหมวดหมู่ =====
function renderFilters() {
  const cats = ["ทั้งหมด", ...allCategories];
  filtersEl.innerHTML = cats.map(c =>
    `<button class="cat-btn ${c === activeCategory ? "active" : ""}" data-cat="${c}">${c}</button>`
  ).join("");
  filtersEl.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderFilters();
      loadProducts();
    });
  });
}

function formatPrice(n) {
  return "฿" + Number(n).toLocaleString("th-TH");
}

// ===== แสดงสินค้า =====
function renderProducts() {
  const html = pagination.currentPage.map(p => {
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

  grid.innerHTML += html;

  grid.querySelectorAll(".product-card").forEach(card =>
    card.addEventListener("click", () => openModal(card.dataset.id)));
}

// ===== Modal รายละเอียด =====
function openModal(id) {
  const p = pagination.currentPage.find(x => x.id === id);
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
  let searchTimeout;
  searchInput.addEventListener("input", e => {
    searchTerm = e.target.value.trim();
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadProducts(), 500);
  });
}

// ===== Load More Button =====
if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", () => loadProducts(true));
}

// ===== เมนูมือถือ =====
const navToggle = document.getElementById("navToggle");
const mainNav   = document.getElementById("mainNav");
if (navToggle) navToggle.addEventListener("click", () => mainNav.classList.toggle("open"));
