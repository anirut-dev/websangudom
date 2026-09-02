(function () {
  const WEB_APP_URL = (window.STOCK_CHECK_CONFIG && window.STOCK_CHECK_CONFIG.WEB_APP_URL) || "";

  const els = {
    warning: document.getElementById("warning"),
    personInput: document.getElementById("personInput"),
    categorySelect: document.getElementById("categorySelect"),
    searchInput: document.getElementById("searchInput"),
    hideCheckedToggle: document.getElementById("hideCheckedToggle"),
    refreshBtn: document.getElementById("refreshBtn"),
    progress: document.getElementById("progress"),
    list: document.getElementById("list"),
    syncStatus: document.getElementById("syncStatus"),
  };

  let products = [];
  let statusMap = {}; // sku -> { checked, person, time }

  function personName() {
    return (els.personInput.value || "").trim() || "ไม่ระบุชื่อ";
  }

  function setSyncStatus(text, isError) {
    els.syncStatus.textContent = text;
    els.syncStatus.className = isError ? "sync-status error" : "sync-status";
  }

  async function loadProducts() {
    const res = await fetch("../data/products.json");
    products = await res.json();
    const categories = [...new Set(products.map((p) => p.category))].sort();
    for (const c of categories) {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      els.categorySelect.appendChild(opt);
    }
  }

  async function loadStatus() {
    if (!WEB_APP_URL) return;
    setSyncStatus("กำลังโหลดสถานะล่าสุด...");
    try {
      const res = await fetch(WEB_APP_URL, { method: "GET" });
      const json = await res.json();
      if (json.ok) {
        statusMap = json.data || {};
        setSyncStatus("อัปเดตล่าสุด: " + new Date().toLocaleTimeString("th-TH"));
      } else {
        setSyncStatus("โหลดสถานะไม่สำเร็จ", true);
      }
    } catch (err) {
      setSyncStatus("เชื่อมต่อ Google Sheet ไม่ได้ (เช็คอินเทอร์เน็ต)", true);
    }
  }

  async function sendTick(product, checked) {
    if (!WEB_APP_URL) return;
    setSyncStatus("กำลังบันทึก...");
    try {
      await fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          sku: product.sku,
          name: product.name,
          category: product.category,
          checked,
          person: personName(),
        }),
      });
      setSyncStatus("บันทึกแล้ว " + new Date().toLocaleTimeString("th-TH"));
    } catch (err) {
      setSyncStatus("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง", true);
    }
  }

  function updateProgress() {
    const total = products.length;
    const checkedCount = products.filter((p) => statusMap[p.sku] && statusMap[p.sku].checked).length;
    els.progress.textContent = `ติ๊กแล้ว ${checkedCount} / ${total} รายการ`;
  }

  function render() {
    const category = els.categorySelect.value;
    const keyword = els.searchInput.value.trim().toLowerCase();
    const hideChecked = els.hideCheckedToggle.checked;

    els.list.innerHTML = "";
    const frag = document.createDocumentFragment();

    let shown = 0;
    for (const p of products) {
      if (category && p.category !== category) continue;
      if (keyword && !p.name.toLowerCase().includes(keyword) && !p.sku.toLowerCase().includes(keyword)) continue;
      const st = statusMap[p.sku];
      const checked = !!(st && st.checked);
      if (hideChecked && checked) continue;

      const card = document.createElement("label");
      card.className = "card" + (checked ? " checked" : "");

      const img = document.createElement("img");
      img.loading = "lazy";
      img.src = "../" + p.image;
      img.alt = p.name;

      const info = document.createElement("div");
      info.className = "info";
      const sku = document.createElement("div");
      sku.className = "sku";
      sku.textContent = p.sku;
      const name = document.createElement("div");
      name.className = "name";
      name.textContent = p.name;
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = st && st.checked ? `✔ ${st.person || ""}` : "";
      info.append(sku, name, meta);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = checked;
      checkbox.addEventListener("change", async () => {
        statusMap[p.sku] = {
          checked: checkbox.checked,
          person: personName(),
          time: new Date().toISOString(),
        };
        card.classList.toggle("checked", checkbox.checked);
        meta.textContent = checkbox.checked ? `✔ ${personName()}` : "";
        updateProgress();
        await sendTick(p, checkbox.checked);
      });

      card.append(checkbox, img, info);
      frag.appendChild(card);
      shown++;
    }
    els.list.appendChild(frag);
    if (shown === 0) {
      els.list.innerHTML = '<p class="empty">ไม่พบสินค้าที่ตรงเงื่อนไข</p>';
    }
    updateProgress();
  }

  function exportCsv() {
    const rows = [["SKU", "ชื่อสินค้า", "หมวด", "ติ๊กแล้ว", "ผู้เช็ค"]];
    for (const p of products) {
      const st = statusMap[p.sku];
      rows.push([p.sku, p.name, p.category, st && st.checked ? "TRUE" : "FALSE", (st && st.person) || ""]);
    }
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock-check-report.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function init() {
    if (!WEB_APP_URL) {
      els.warning.hidden = false;
    }
    els.personInput.value = localStorage.getItem("stockCheckPerson") || "";
    els.personInput.addEventListener("input", () => {
      localStorage.setItem("stockCheckPerson", els.personInput.value);
    });
    els.categorySelect.addEventListener("change", render);
    els.searchInput.addEventListener("input", render);
    els.hideCheckedToggle.addEventListener("change", render);
    els.refreshBtn.addEventListener("click", async () => {
      await loadStatus();
      render();
    });
    document.getElementById("exportBtn").addEventListener("click", exportCsv);

    await loadProducts();
    await loadStatus();
    render();
  }

  init();
})();
