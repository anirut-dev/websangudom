// ===== หน้าจัดการสินค้า (admin.html) =====
// เวอร์ชันเดโม: ใช้ localStorage เก็บข้อมูล + login ง่ายๆ
// อนาคต: เปลี่ยนมาใช้ Firebase Auth (login) + Firestore (เก็บข้อมูล)
//        ดูคำแนะนำในไฟล์ README.md

// --- ค่า login เดโม (ของจริงจะย้ายไป Firebase) ---
const DEMO_USER = "admin";
const DEMO_PASS = "1234";

const loginView = document.getElementById("loginView");
const adminView = document.getElementById("adminView");
const loginAlert = document.getElementById("loginAlert");

// โหลด/บันทึกสินค้าใน localStorage
function getProducts() {
  const saved = localStorage.getItem("sangudom_products");
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [...SAMPLE_PRODUCTS];
}
function saveProducts(list) {
  localStorage.setItem("sangudom_products", JSON.stringify(list));
}

let products = getProducts();
let editingId = null;

// --- ตรวจสถานะ login ---
function isLoggedIn() {
  return sessionStorage.getItem("sangudom_admin") === "1";
}
function showAdmin() {
  loginView.hidden = true;
  adminView.hidden = false;
  renderTable();
}

// --- Login ---
document.getElementById("loginBtn").addEventListener("click", () => {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value;
  if (u === DEMO_USER && p === DEMO_PASS) {
    sessionStorage.setItem("sangudom_admin", "1");
    showAdmin();
  } else {
    loginAlert.innerHTML =
      '<div class="alert alert-error">ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง</div>';
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("sangudom_admin");
  loginView.hidden = false;
  adminView.hidden = true;
});

// --- ตารางสินค้า ---
function formatPrice(n) {
  return "฿" + Number(n).toLocaleString("th-TH");
}
function renderTable() {
  const body = document.getElementById("adminTableBody");
  body.innerHTML = products
    .map(
      (p) => `
    <tr>
      <td>${p.emoji || "💡"} ${p.name}</td>
      <td>${p.category}</td>
      <td>${formatPrice(p.price)}</td>
      <td class="row-actions">
        <button class="mini-btn" data-edit="${p.id}">แก้ไข</button>
        <button class="mini-btn del" data-del="${p.id}">ลบ</button>
      </td>
    </tr>`
    )
    .join("");

  body.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => openForm(b.dataset.edit))
  );
  body.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => deleteProduct(b.dataset.del))
  );
}

// --- ฟอร์มเพิ่ม/แก้ไข ---
const formOverlay = document.getElementById("formOverlay");
const catSelect = document.getElementById("f_category");
catSelect.innerHTML = CATEGORIES.map((c) => `<option>${c}</option>`).join("");

function openForm(id) {
  editingId = id || null;
  document.getElementById("formTitle").textContent = id ? "แก้ไขสินค้า" : "เพิ่มสินค้า";
  const p = id ? products.find((x) => x.id === id) : null;
  document.getElementById("f_name").value = p ? p.name : "";
  document.getElementById("f_category").value = p ? p.category : CATEGORIES[0];
  document.getElementById("f_price").value = p ? p.price : "";
  document.getElementById("f_emoji").value = p ? p.emoji : "💡";
  document.getElementById("f_desc").value = p ? p.desc : "";
  formOverlay.classList.add("open");
}
function closeForm() {
  formOverlay.classList.remove("open");
}
document.getElementById("addBtn").addEventListener("click", () => openForm(null));
document.getElementById("formClose").addEventListener("click", closeForm);
formOverlay.addEventListener("click", (e) => {
  if (e.target === formOverlay) closeForm();
});

document.getElementById("saveBtn").addEventListener("click", () => {
  const name = document.getElementById("f_name").value.trim();
  const price = document.getElementById("f_price").value;
  if (!name || !price) {
    alert("กรุณากรอกชื่อสินค้าและราคา");
    return;
  }
  const data = {
    name,
    category: document.getElementById("f_category").value,
    price: Number(price),
    emoji: document.getElementById("f_emoji").value || "💡",
    image: "",
    desc: document.getElementById("f_desc").value.trim(),
  };
  if (editingId) {
    const i = products.findIndex((x) => x.id === editingId);
    products[i] = { ...products[i], ...data };
  } else {
    data.id = "p" + Date.now();
    products.push(data);
  }
  saveProducts(products);
  renderTable();
  closeForm();
});

function deleteProduct(id) {
  if (!confirm("ลบสินค้านี้?")) return;
  products = products.filter((x) => x.id !== id);
  saveProducts(products);
  renderTable();
}

// เริ่มต้น: ถ้า login อยู่แล้วให้เข้าหน้า admin เลย
if (isLoggedIn()) showAdmin();
