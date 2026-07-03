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

// --- Cascading category selectors ---
const catMain    = document.getElementById("f_cat_main");
const catSub     = document.getElementById("f_cat_sub");
const catSubWrap = document.getElementById("f_cat_sub_wrap");

function updateSubCat(selectedSub) {
  const group = (typeof CATEGORY_TREE !== "undefined")
    ? CATEGORY_TREE.find(g => g.main === catMain.value) : null;
  if (!group || group.subs.length === 0) {
    catSubWrap.hidden = true;
    catSub.innerHTML = "";
    return;
  }
  catSubWrap.hidden = false;
  catSub.innerHTML = group.subs.map(s => `<option value="${s}">${s}</option>`).join("");
  if (selectedSub) catSub.value = selectedSub;
}

function getCategoryValue() {
  return (!catSubWrap.hidden && catSub.value) ? catSub.value : catMain.value;
}

function setCategoryValue(cat) {
  if (typeof CATEGORY_TREE === "undefined") return;
  const asMain = CATEGORY_TREE.find(g => g.main === cat);
  if (asMain) { catMain.value = cat; updateSubCat(); return; }
  for (const g of CATEGORY_TREE) {
    if (g.subs.includes(cat)) { catMain.value = g.main; updateSubCat(cat); return; }
  }
  catMain.value = CATEGORY_TREE[0].main; updateSubCat();
}

if (catMain && typeof CATEGORY_TREE !== "undefined") {
  catMain.innerHTML = CATEGORY_TREE.map(g => `<option value="${g.main}">${g.main}</option>`).join("");
  catMain.addEventListener("change", () => updateSubCat());
  updateSubCat();
}

// --- แผนที่หมวดหมู่ → โฟลเดอร์รูป (slug เรียงตรงกับ subs ใน CATEGORY_TREE) ---
const FOLDER_TREE = {
  "Exterior Lamp":    { folder: "exterior",    subs: ["gate-lamp","wall-lamp","garden-lamp","street-light","step-light","accent-light"] },
  "Interior Lamp":    { folder: "interior",    subs: ["ceiling-lamp","pendant-lamp","wall-lamp","table-floor-lamp","downlight-tracklight","step-light","t-bar-fluorescent","high-bay"] },
  "Chandelier":       { folder: "chandelier",  subs: ["pendant-crystal","wall-crystal","chat-crystal"] },
  "LED":              { folder: "led",         subs: ["led-bulb-downlight","ceiling-lamp","step-light-line","spotlight-floodlight","street-garden-light"] },
  "Bulb Accessories": { folder: "accessories", subs: ["bulb","accessories"] },
  "Furniture":        { folder: "furniture",   subs: [] },
  "Other Products":   { folder: "other",       subs: [] },
  "Solar cell":       { folder: "solar",       subs: [] },
};

// คืน path prefix ของโฟลเดอร์จากหมวดที่เลือกอยู่ เช่น "images/products/exterior/accent-light/"
function getCategoryFolder() {
  const map = FOLDER_TREE[catMain.value];
  if (!map) return "images/products/";
  let path = "images/products/" + map.folder + "/";
  if (!catSubWrap.hidden && catSub.value) {
    const group = CATEGORY_TREE.find(g => g.main === catMain.value);
    const idx = group ? group.subs.indexOf(catSub.value) : -1;
    if (idx >= 0 && map.subs[idx]) path += map.subs[idx] + "/";
  }
  return path;
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
      <td style="font-size:.8rem;color:var(--gray);font-family:monospace">${p.sku || "—"}</td>
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
  document.getElementById("f_sku").value       = p ? (p.sku || "") : "";
  document.getElementById("f_name").value     = p ? p.name     : "";
  setCategoryValue(p ? p.category : (typeof CATEGORY_TREE !== "undefined" ? CATEGORY_TREE[0].main : ""));
  document.getElementById("f_price").value    = p ? p.price    : "";
  document.getElementById("f_emoji").value    = p ? p.emoji    : "💡";
  document.getElementById("f_desc").value     = p ? p.desc     : "";

  const imageInput   = document.getElementById("f_image");
  const imagePreview = document.getElementById("f_image_preview");
  imageInput.value = p && p.image ? p.image : "";
  if (p && p.image) {
    imagePreview.src    = p.image;
    imagePreview.hidden = false;
  } else {
    imagePreview.src    = "";
    imagePreview.hidden = true;
  }

  formOverlay.classList.add("open");
}

document.getElementById("f_image").addEventListener("input", () => {
  const path    = document.getElementById("f_image").value.trim();
  const preview = document.getElementById("f_image_preview");
  if (!path) { preview.hidden = true; return; }
  preview.src    = path;
  preview.hidden = false;
});

// --- Browse button ---
document.getElementById("browseBtn").addEventListener("click", () => {
  document.getElementById("f_image_file").click();
});
document.getElementById("f_image_file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const preview  = document.getElementById("f_image_preview");
  const pathInput = document.getElementById("f_image");
  // แสดง preview ด้วย blob URL (local เท่านั้น)
  preview.src    = URL.createObjectURL(file);
  preview.hidden = false;
  // เติม path โฟลเดอร์อัตโนมัติจากหมวดหมู่ที่เลือก + ชื่อไฟล์
  // (เบราว์เซอร์ให้แค่ชื่อไฟล์ ไม่ให้ path จริง จึงคำนวณโฟลเดอร์จากหมวดแทน)
  pathInput.value = getCategoryFolder() + file.name;
});

function closeForm() { formOverlay.classList.remove("open"); }

document.getElementById("addBtn").addEventListener("click", () => openForm(null));
document.getElementById("formClose").addEventListener("click", closeForm);
formOverlay.addEventListener("click", e => { if (e.target === formOverlay) closeForm(); });

document.getElementById("saveBtn").addEventListener("click", async () => {
  const name  = document.getElementById("f_name").value.trim();
  const price = document.getElementById("f_price").value;
  if (!name || !price) { alert("กรุณากรอกชื่อสินค้าและราคา"); return; }

  const data = {
    sku:      document.getElementById("f_sku").value.trim(),
    name,
    category: getCategoryValue(),
    price:    Number(price),
    emoji:    document.getElementById("f_emoji").value || "💡",
    image:    document.getElementById("f_image").value.trim(),
    desc:     document.getElementById("f_desc").value.trim(),
  };

  const saveBtn = document.getElementById("saveBtn");
  const originalLabel = saveBtn.textContent;
  saveBtn.disabled = true;

  try {
    saveBtn.textContent = "กำลังบันทึก...";
    if (editingId) {
      await updateDoc(doc(db, "products", editingId), data);
    } else {
      await addDoc(collection(db, "products"), data);
    }
    closeForm();
  } catch (e) {
    alert("บันทึกไม่สำเร็จ: " + e.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalLabel;
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
