// ===== ระบบขอใบเสนอราคา (Quote Request) =====
// ลูกค้าเพิ่มสินค้าลงรายการ → ส่งให้ร้านทาง LINE
// เก็บใน localStorage (ไม่ใช้ Firebase) — ทำงานบน GitHub Pages ได้ 100% ฟรี
//
// วิธีส่ง: คัดลอกรายการอัตโนมัติ + เปิดแชท LINE ร้าน → ลูกค้าวาง (paste) ในแชท
// (LINE ปิดฟีเจอร์ pre-fill ข้อความผ่าน URL ไปแล้ว จึงใช้วิธี copy+paste ที่เสถียรกว่า)

const QUOTE_KEY  = "sangudom_quote";
const LINE_URL   = "https://line.me/ti/p/~Sangudom-sale";
const LINE_LABEL = "@Sangudom-sale";

// ── State ──
function loadQuote() {
  try { return JSON.parse(localStorage.getItem(QUOTE_KEY)) || []; }
  catch { return []; }
}
function saveQuote(list) {
  localStorage.setItem(QUOTE_KEY, JSON.stringify(list));
  renderBadge();
  renderDrawer();
}

// เพิ่ม/ลบสินค้า
function addToQuote(item) {
  const list = loadQuote();
  const existing = list.find(x => x.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    list.push({ id: item.id, name: item.name, sku: item.sku || "", qty: 1 });
  }
  saveQuote(list);
  toast(`เพิ่ม "${item.name}" ลงรายการขอราคาแล้ว`);
}
function setQty(id, qty) {
  let list = loadQuote();
  if (qty <= 0) {
    list = list.filter(x => x.id !== id);
  } else {
    const it = list.find(x => x.id === id);
    if (it) it.qty = qty;
  }
  saveQuote(list);
}
function clearQuote() {
  saveQuote([]);
}

// ── ข้อความสำหรับส่ง LINE ──
function buildMessage() {
  const list = loadQuote();
  if (!list.length) return "";
  let msg = "สนใจขอใบเสนอราคาสินค้าดังนี้ครับ/ค่ะ\n\n";
  list.forEach((it, i) => {
    const code = it.sku ? ` (${it.sku})` : "";
    msg += `${i + 1}. ${it.name}${code} จำนวน ${it.qty}\n`;
  });
  msg += "\nรบกวนเสนอราคาด้วยครับ/ค่ะ ขอบคุณครับ/ค่ะ";
  return msg;
}

// ── ส่งทาง LINE (copy + เปิดแชท) ──
async function sendToLine() {
  const list = loadQuote();
  if (!list.length) { toast("ยังไม่มีสินค้าในรายการ"); return; }
  const msg = buildMessage();
  try {
    await navigator.clipboard.writeText(msg);
    toast("✓ คัดลอกรายการแล้ว — เปิด LINE แล้ววางในแชทได้เลย");
  } catch {
    // ถ้า copy ไม่ได้ (permission) ยังเปิด LINE ให้อยู่ดี
    toast("เปิด LINE — พิมพ์รายการในแชทได้เลย");
  }
  setTimeout(() => window.open(LINE_URL, "_blank", "noopener"), 600);
}

// ── UI: Badge (ปุ่มลอย) ──
function renderBadge() {
  const count = loadQuote().reduce((s, x) => s + x.qty, 0);
  let fab = document.getElementById("quoteFab");
  if (!fab) {
    fab = document.createElement("button");
    fab.id = "quoteFab";
    fab.type = "button";
    fab.className = "quote-fab";
    fab.setAttribute("aria-label", "รายการขอใบเสนอราคา");
    fab.addEventListener("click", openDrawer);
    document.body.appendChild(fab);
  }
  fab.innerHTML = `
    <span class="quote-fab-ico">📋</span>
    <span class="quote-fab-text">ขอใบเสนอราคา</span>
    <span class="quote-fab-count" ${count ? "" : "hidden"}>${count}</span>
  `;
  fab.classList.toggle("has-items", count > 0);
}

// ── UI: Drawer (รายการ) ──
function ensureDrawer() {
  let overlay = document.getElementById("quoteOverlay");
  if (overlay) return overlay;
  overlay = document.createElement("div");
  overlay.id = "quoteOverlay";
  overlay.className = "quote-overlay";
  overlay.innerHTML = `
    <div class="quote-drawer" role="dialog" aria-label="รายการขอใบเสนอราคา">
      <div class="quote-drawer-head">
        <h3>รายการขอใบเสนอราคา</h3>
        <button type="button" class="quote-close" id="quoteClose" aria-label="ปิด">×</button>
      </div>
      <div class="quote-drawer-body" id="quoteBody"></div>
      <div class="quote-drawer-foot" id="quoteFoot"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeDrawer(); });
  overlay.querySelector("#quoteClose").addEventListener("click", closeDrawer);
  return overlay;
}
function renderDrawer() {
  const overlay = document.getElementById("quoteOverlay");
  if (!overlay) return;
  const list = loadQuote();
  const body = overlay.querySelector("#quoteBody");
  const foot = overlay.querySelector("#quoteFoot");

  if (!list.length) {
    body.innerHTML = `<p class="quote-empty">ยังไม่มีสินค้าในรายการ<br /><span>เลือกสินค้าแล้วกด "＋ ขอราคา" เพื่อเพิ่ม</span></p>`;
    foot.innerHTML = "";
    return;
  }

  body.innerHTML = list.map(it => `
    <div class="quote-item" data-id="${it.id}">
      <div class="quote-item-info">
        <div class="quote-item-name">${it.name}</div>
        ${it.sku ? `<div class="quote-item-sku">${it.sku}</div>` : ""}
      </div>
      <div class="quote-qty">
        <button type="button" class="qty-btn" data-act="dec">−</button>
        <span class="qty-num">${it.qty}</span>
        <button type="button" class="qty-btn" data-act="inc">＋</button>
      </div>
      <button type="button" class="quote-item-del" data-act="del" aria-label="ลบ">🗑</button>
    </div>
  `).join("");

  foot.innerHTML = `
    <button type="button" class="btn-line-send" id="quoteSend">
      <span class="line-ico">💬</span> ส่งขอราคาทาง LINE
    </button>
    <div class="quote-line-hint">ส่งถึง LINE: <strong>${LINE_LABEL}</strong> — รายการจะถูกคัดลอกอัตโนมัติ</div>
    <button type="button" class="btn-quote-clear" id="quoteClear">ล้างรายการทั้งหมด</button>
  `;

  // events
  body.querySelectorAll(".quote-item").forEach(row => {
    const id = row.dataset.id;
    row.querySelector('[data-act="inc"]').addEventListener("click", () => {
      const it = loadQuote().find(x => x.id === id); setQty(id, (it?.qty || 0) + 1);
    });
    row.querySelector('[data-act="dec"]').addEventListener("click", () => {
      const it = loadQuote().find(x => x.id === id); setQty(id, (it?.qty || 0) - 1);
    });
    row.querySelector('[data-act="del"]').addEventListener("click", () => setQty(id, 0));
  });
  foot.querySelector("#quoteSend").addEventListener("click", sendToLine);
  foot.querySelector("#quoteClear").addEventListener("click", () => {
    if (confirm("ล้างรายการขอราคาทั้งหมด?")) clearQuote();
  });
}
function openDrawer() {
  ensureDrawer();
  renderDrawer();
  document.getElementById("quoteOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeDrawer() {
  const o = document.getElementById("quoteOverlay");
  if (o) o.classList.remove("open");
  document.body.style.overflow = "";
}

// ── Toast ──
let toastTimer = null;
function toast(text) {
  let el = document.getElementById("quoteToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "quoteToast";
    el.className = "quote-toast";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

// ── Event delegation: ปุ่ม "ขอราคา" บนการ์ด/modal (รองรับ element ที่ render ทีหลัง) ──
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-quote-add]");
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  addToQuote({
    id:   btn.dataset.quoteAdd,
    name: btn.dataset.quoteName,
    sku:  btn.dataset.quoteSku,
  });
});

// ── Init ──
renderBadge();
