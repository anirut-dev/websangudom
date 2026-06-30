// ===== หน้าจัดการสินค้า (admin.html) =====
// เวอร์ชัน Firebase: ใช้ Firestore เก็บข้อมูล + Firebase Auth login

import { db, auth } from "./firebase-config.js";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// --- Elements ---
const loginView  = document.getElementById("loginView");
const adminView  = document.getElementById("adminView");
const loginAlert = document.getElementById("loginAlert");
const formOverlay = document.getElementById("formOverlay");
const catSelect   = document.getElementById("f_category");

// populate หมวดหมู่ (ดึงจาก data.js ที่โหลดก่อนหน้า)
if (catSelect && typeof CATEGORIES !== "undefined") {
  catSelect.innerHTML = CATEGORIES.map(c => `<option>${c}</option>`).join("");
}

// --- Header user info ---
const headerUser      = document.getElementById("headerUser");
const headerEmail     = document.getElementById("headerEmail");
const headerLogoutBtn = document.getElementById("headerLogoutBtn");
if (headerLogoutBtn) headerLogoutBtn.addEventListener("click", () => signOut(auth));

// --- Auth state ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginView.hidden = true;
    adminView.hidden = false;
    // แสดงชื่อ email ที่ header
    if (headerUser)  headerUser.classList.add("show");
    if (headerEmail) headerEmail.textContent   = user.email;
    listenProducts();
  } else {
    loginView.hidden = false;
    adminView.hidden = true;
    if (headerUser) headerUser.classList.remove("show");
  }
});

// --- Login ---
document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("username").value.trim();
  const pass  = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    loginAlert.innerHTML = '<div class="alert alert-error">อีเมลหรือรหัสผ่านไม่ถูกต้อง</div>';
  }
});


// --- Real-time listener ---
let unsubscribe = null;
function listenProducts() {
  const q = query(collection(db, "products"), orderBy("name"));
  unsubscribe = onSnapshot(q, (snap) => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable();
  });
}

let products = [];
let editingId = null;

function formatPrice(n) {
  return "฿" + Number(n).toLocaleString("th-TH");
}

// --- Table ---
function renderTable() {
  const body = document.getElementById("adminTableBody");
  if (!products.length) {
    body.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#999;padding:24px">ยังไม่มีสินค้า — กด "+ เพิ่มสินค้า" เพื่อเริ่มต้น</td></tr>`;
    return;
  }
  body.innerHTML = products.map(p => `
    <tr>
      <td>${p.emoji || "💡"} ${p.name}</td>
      <td>${p.category}</td>
      <td>${formatPrice(p.price)}</td>
      <td class="row-actions">
        <button class="mini-btn" data-edit="${p.id}">แก้ไข</button>
        <button class="mini-btn del" data-del="${p.id}">ลบ</button>
      </td>
    </tr>`).join("");

  body.querySelectorAll("[data-edit]").forEach(b =>
    b.addEventListener("click", () => openForm(b.dataset.edit)));
  body.querySelectorAll("[data-del]").forEach(b =>
    b.addEventListener("click", () => deleteProduct(b.dataset.del)));
}

// --- Form ---
function openForm(id) {
  editingId = id || null;
  document.getElementById("formTitle").textContent = id ? "แก้ไขสินค้า" : "เพิ่มสินค้า";
  const p = id ? products.find(x => x.id === id) : null;
  document.getElementById("f_name").value     = p ? p.name     : "";
  document.getElementById("f_category").value = p ? p.category : CATEGORIES[0];
  document.getElementById("f_price").value    = p ? p.price    : "";
  document.getElementById("f_emoji").value    = p ? p.emoji    : "💡";
  document.getElementById("f_desc").value     = p ? p.desc     : "";
  formOverlay.classList.add("open");
}

function closeForm() { formOverlay.classList.remove("open"); }

document.getElementById("addBtn").addEventListener("click", () => openForm(null));
document.getElementById("formClose").addEventListener("click", closeForm);
formOverlay.addEventListener("click", e => { if (e.target === formOverlay) closeForm(); });

document.getElementById("saveBtn").addEventListener("click", async () => {
  const name  = document.getElementById("f_name").value.trim();
  const price = document.getElementById("f_price").value;
  if (!name || !price) { alert("กรุณากรอกชื่อสินค้าและราคา"); return; }

  const data = {
    name,
    category: document.getElementById("f_category").value,
    price:    Number(price),
    emoji:    document.getElementById("f_emoji").value || "💡",
    image:    "",
    desc:     document.getElementById("f_desc").value.trim(),
  };

  try {
    if (editingId) {
      await updateDoc(doc(db, "products", editingId), data);
    } else {
      await addDoc(collection(db, "products"), data);
    }
    closeForm();
  } catch (e) {
    alert("บันทึกไม่สำเร็จ: " + e.message);
  }
});

async function deleteProduct(id) {
  if (!confirm("ลบสินค้านี้?")) return;
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (e) {
    alert("ลบไม่สำเร็จ: " + e.message);
  }
}
