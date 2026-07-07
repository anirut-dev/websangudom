// ===== ระบบขอใบเสนอราคา (Quote Request) =====
// ลูกค้าเพิ่มสินค้าลงรายการ → ส่งให้ร้านทาง LINE
// เก็บใน localStorage (ไม่ใช้ Firebase) — ทำงานบน GitHub Pages ได้ 100% ฟรี
//
// วิธีส่ง: เปิดแชท LINE Official Account ร้าน พร้อม pre-fill ข้อความอัตโนมัติ
// ผ่าน oaMessage URL scheme (ทางการ LINE) — ลูกค้าแค่กดส่งในแชท
// ยัง copy ข้อความไว้ใน clipboard เป็น fallback เผื่อ LINE บางเครื่องไม่ populate
// docs: https://developers.line.biz/en/docs/messaging-api/using-line-url-scheme/

const QUOTE_KEY   = "sangudom_quote";
const LINE_OA_ID  = "@Sangudom-sale";               // Basic ID ของ Official Account
const LINE_LABEL  = LINE_OA_ID;
const LINE_OA_URL = "https://line.me/ti/p/~Sangudom-sale";  // หน้าโปรไฟล์/เพิ่มเพื่อน OA
// มือถือ: oaMessage เปิดแอป LINE + pre-fill ข้อความได้ / เดสก์ท็อป: เว็บเป็นหน้า QR ตัน → ใช้ copy+paste แทน
const IS_MOBILE = /android|iphone|ipad|ipod|mobile|line\//i.test(navigator.userAgent);
// เปิดแชท OA + ใส่ข้อความ (percent-encode ทั้ง ID และข้อความ เป็น UTF-8)
function oaMessageUrl(msg) {
  return `https://line.me/R/oaMessage/${encodeURIComponent(LINE_OA_ID)}/?${encodeURIComponent(msg)}`;
}

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

// ── ส่งทาง LINE ──
// NOTE: pre-fill ผ่าน oaMessage ต้องใช้ "Basic ID" ของ OA (เช่น @abcd1234) — ยังไม่มี
// (@Sangudom-sale ที่มีคือ vanity/search ID → oaMessage คืน "ไม่พบผู้ใช้")
// ระหว่างนี้ใช้: คัดลอกรายการ + เปิดแชทด้วยลิงก์ ti/p (เปิดแชทได้ชัวร์) → ลูกค้าวาง
// เมื่อได้ Basic ID แล้ว เปลี่ยน mobile path กลับไปใช้ oaMessageUrl(msg) เพื่อ pre-fill
async function sendToLine() {
  const list = loadQuote();
  if (!list.length) { toast("ยังไม่มีสินค้าในรายการ"); return; }
  const msg = buildMessage();
  let copied = false;
  try { await navigator.clipboard.writeText(msg); copied = true; } catch {}

  if (IS_MOBILE) {
    // มือถือ: คัดลอกรายการ + เปิดแชท LINE ร้าน → กดค้างในช่องพิมพ์ → วาง → ส่ง
    toast(copied ? "✓ คัดลอกรายการแล้ว — เปิดแชทแล้ววาง (กดค้าง→วาง) แล้วส่ง"
                 : "เปิดแชท LINE — พิมพ์รายการในแชทได้เลย");
    setTimeout(() => window.open(LINE_OA_URL, "_blank", "noopener"), 500);
  } else {
    // เดสก์ท็อป: โชว์กล่องวิธีวางในแชท (มีข้อความให้ก็อป + ลิงก์เปิดหน้าร้าน)
    showDesktopSendHelp(msg);
  }
}

// ── เดสก์ท็อป: กล่องบอกวิธีส่ง (copy + paste) ──
function showDesktopSendHelp(msg) {
  const overlay = document.getElementById("quoteOverlay");
  if (!overlay) return;
  const foot = overlay.querySelector("#quoteFoot");
  foot.innerHTML = `
    <div class="quote-desktop-help">
      <div class="qdh-title">✓ คัดลอกรายการแล้ว</div>
      <ol class="qdh-steps">
        <li>เปิดแอป <strong>LINE</strong> บนคอมหรือมือถือ</li>
        <li>เข้าแชทร้าน <strong>${LINE_LABEL}</strong></li>
        <li>วางข้อความ (<strong>Ctrl+V</strong>) แล้วกดส่ง</li>
      </ol>
      <textarea class="qdh-text" id="qdhText" readonly>${msg}</textarea>
      <button type="button" class="btn-line-send" id="qdhCopy">
        <span class="line-ico">📋</span> คัดลอกอีกครั้ง
      </button>
      <a class="btn-quote-clear" href="${LINE_OA_URL}" target="_blank" rel="noopener"
         style="text-align:center;text-decoration:none;line-height:1.6;">เปิดหน้า LINE ร้าน →</a>
      <button type="button" class="btn-quote-clear" id="qdhBack">← กลับไปแก้รายการ</button>
    </div>
  `;
  const ta = foot.querySelector("#qdhText");
  foot.querySelector("#qdhCopy").addEventListener("click", async () => {
    ta.focus(); ta.select();
    try { await navigator.clipboard.writeText(msg); }
    catch { document.execCommand("copy"); }
    toast("คัดลอกแล้ว");
  });
  foot.querySelector("#qdhBack").addEventListener("click", renderDrawer);
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
    <div class="quote-line-hint">คัดลอกรายการอัตโนมัติ + เปิดแชท LINE ร้าน <strong>${LINE_LABEL}</strong> → วางแล้วส่ง</div>
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
