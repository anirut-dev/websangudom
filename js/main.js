// ===== หน้าแคตตาล็อก (index.html) =====

// โหลดสินค้า: ถ้ามีข้อมูลที่ admin บันทึกไว้ใน localStorage ให้ใช้อันนั้น
// ไม่งั้นใช้ข้อมูลตัวอย่างจาก data.js
function loadProducts() {
  const saved = localStorage.getItem("sangudom_products");
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { /* ignore */ }
  }
  return SAMPLE_PRODUCTS;
}

let allProducts = loadProducts();
let activeCategory = "ทั้งหมด";
let searchTerm = "";

const grid = document.getElementById("productGrid");
const emptyMsg = document.getElementById("emptyMsg");
const searchInput = document.getElementById("searchInput");
const filtersEl = document.getElementById("categoryFilters");

// สร้างปุ่มหมวดหมู่
function renderFilters() {
  const cats = ["ทั้งหมด", ...CATEGORIES];
  filtersEl.innerHTML = cats
    .map(
      (c) =>
        `<button class="cat-btn ${c === activeCategory ? "active" : ""}" data-cat="${c}">${c}</button>`
    )
    .join("");
  filtersEl.querySelectorAll(".cat-btn").forEach((btn) => {
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

// แสดงสินค้า
function renderProducts() {
  const list = allProducts.filter((p) => {
    const matchCat = activeCategory === "ทั้งหมด" || p.category === activeCategory;
    const matchSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm);
    return matchCat && matchSearch;
  });

  emptyMsg.hidden = list.length > 0;

  grid.innerHTML = list
    .map((p) => {
      const imgStyle = p.image
        ? `style="background-image:url('${p.image}')"`
        : "";
      const imgContent = p.image ? "" : p.emoji || "💡";
      return `
      <article class="product-card" data-id="${p.id}">
        <div class="product-img" ${imgStyle}>${imgContent}</div>
        <div class="product-body">
          <span class="product-cat">${p.category}</span>
          <h3 class="product-name">${p.name}</h3>
          <span class="product-price">${formatPrice(p.price)}</span>
        </div>
      </article>`;
    })
    .join("");

  grid.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => openModal(card.dataset.id));
  });
}

// ===== Modal รายละเอียดสินค้า =====
function openModal(id) {
  const p = allProducts.find((x) => x.id === id);
  if (!p) return;
  let overlay = document.getElementById("modalOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "modalOverlay";
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);
  }
  const imgStyle = p.image ? `style="background-image:url('${p.image}')"` : "";
  const imgContent = p.image ? "" : p.emoji || "💡";
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
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
}
function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.classList.remove("open");
}

// ===== ค้นหา =====
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderProducts();
  });
}

// ===== เมนูมือถือ =====
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");
if (navToggle) {
  navToggle.addEventListener("click", () => mainNav.classList.toggle("open"));
}

// เริ่มต้น
if (grid) {
  renderFilters();
  renderProducts();
}
