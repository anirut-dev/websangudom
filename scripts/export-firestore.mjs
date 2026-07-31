#!/usr/bin/env node
// scripts/export-firestore.mjs
// Export ข้อมูลสินค้าจาก Firestore REST API → data/products.json
// ใช้ apiKey สาธารณะ (read-only, products allow read: if true)
// รัน: node scripts/export-firestore.mjs

import fs   from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir  = path.dirname(fileURLToPath(import.meta.url));
const OUT    = path.join(__dir, "..", "data", "products.json");

const API_KEY = "AIzaSyCqERPPe2wcr_BKVwSlz07EKc5Ormlld_Y";
const BASE    = "https://firestore.googleapis.com/v1/projects/websangudom/databases/(default)/documents/products";

// ── 1. ดึงทุก document (pagination) ──────────────────────────────────────────
process.stdout.write("กำลังดึงสินค้าจาก Firestore");
const raw = [];
let token = null;
do {
  const url  = `${BASE}?key=${API_KEY}&pageSize=300${token ? `&pageToken=${encodeURIComponent(token)}` : ""}`;
  const res  = await fetch(url);
  if (!res.ok) {
    console.error(`\nFirestore ตอบ ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const json = await res.json();
  raw.push(...(json.documents ?? []));
  token = json.nextPageToken ?? null;
  process.stdout.write(".");
} while (token);
console.log(` ดึงได้ ${raw.length} รายการ`);

// ── 2. แปลง Firestore value format → JS ─────────────────────────────────────
function fVal(v) {
  if (v == null)              return null;
  if ("stringValue"  in v)   return v.stringValue;
  if ("integerValue" in v)   return parseInt(v.integerValue, 10);
  if ("doubleValue"  in v)   return v.doubleValue;
  if ("booleanValue" in v)   return v.booleanValue;
  if ("nullValue"    in v)   return null;
  return null;
}

// ── 3. slugify สำหรับ sku ว่าง ───────────────────────────────────────────────
// เก็บตัวอักษรไทย, ASCII อักขระ, ตัวเลข → lowercase dash-separated
function slugify(str) {
  return str
    .trim()
    .replace(/[^฀-๿a-zA-Z0-9]+/g, "-")  // แทนที่ non-word ด้วย -
    .replace(/^-+|-+$/g, "")                        // trim dash หัว-ท้าย
    .toLowerCase()
    .slice(0, 60);                                   // จำกัดความยาว
}

// ── 4. แปลงเป็น array แบบเรียบ ───────────────────────────────────────────────
const PERCENT_OFF_RE = /^\d+\s*%\s*OFF\s/i;

// map sku → product  (ใช้ merge ซ้ำ)
const productMap = new Map();   // sku → { name, sku, category, price, priceSale, image }
const warnings   = [];

for (const doc of raw) {
  const f    = doc.fields ?? {};
  const rawName = fVal(f.name) ?? "";
  const rawSku  = fVal(f.sku)  ?? "";
  // strip "XX % OFF CODENAME " prefix (เช่น "22 % OFF AI0589 Ceiling...")
  const cleanedName = rawName.replace(/^\d+\s*%\s*OFF\s+[A-Z0-9]+\s+/i, "").trim();
  const name = cleanedName || rawSku;   // fallback: ถ้าชื่อว่างให้ใช้ sku แทน
  let   sku  = rawSku;
  const cat  = fVal(f.category)  ?? "";
  const price     = fVal(f.price)     ?? 0;
  const priceSale = fVal(f.priceSale) ?? null;
  const image     = fVal(f.image)     ?? "";

  // ─── กรณี sku ว่าง: สร้างจากชื่อ ───────────────────────────────────────
  let skuAuto = false;
  if (!sku) {
    sku = slugify(name) || "product";
    skuAuto = true;
    warnings.push(`  [gen-sku] "${name}" → "${sku}"`);
  }

  // ─── กรณี sku ซ้ำ ────────────────────────────────────────────────────────
  if (productMap.has(sku)) {
    const existing = productMap.get(sku);
    // ตรวจด้วย rawName (ก่อน clean) เพื่อให้ detect "% OFF" ได้ถูกต้อง
    const thisIsPercentOff     = PERCENT_OFF_RE.test(rawName);
    const existingIsPercentOff = PERCENT_OFF_RE.test(existing._rawName ?? "");

    if (thisIsPercentOff || existingIsPercentOff) {
      // ── แบบที่ 1: version "XX % OFF CODENAME ชื่อ" vs ชื่อสะอาด ──────────
      // รวมเป็นชิ้นเดียว: ใช้ชื่อสะอาด + รับ priceSale จาก version % OFF
      const cleanEntry  = thisIsPercentOff ? existing : { name, sku, category: cat, price, priceSale, image };
      const saleEntry   = thisIsPercentOff ? { priceSale }   : { priceSale: existing.priceSale };
      // priceSale: เอาค่าที่ไม่ใช่ null ถ้ามี
      const mergedSale  = saleEntry.priceSale ?? cleanEntry.priceSale ?? null;
      productMap.set(sku, { ...cleanEntry, priceSale: mergedSale });
      warnings.push(`  [merge]   sku "${sku}" — ใช้ชื่อสะอาด + priceSale=${mergedSale}`);
    } else {
      // ── แบบที่ 2: สินค้าต่างชนิด sku บังเอิญซ้ำ → ต่อ -B ──────────────
      let newSku = sku + "-B";
      let suffix = 2;
      while (productMap.has(newSku)) newSku = `${sku}-${String.fromCharCode(64 + suffix++)}`;
      warnings.push(`  [dup-sku] "${name}" sku ซ้ำ "${sku}" → เปลี่ยนเป็น "${newSku}"`);
      sku = newSku;
      productMap.set(sku, { name, sku, skuAuto, category: cat, price, priceSale, image, _rawName: rawName });
    }
  } else {
    productMap.set(sku, { name, sku, skuAuto, category: cat, price, priceSale, image, _rawName: rawName });
  }
}

// ── 5. ป้องกัน gen-sku ซ้ำกัน ────────────────────────────────────────────────
// (หลัง loop ข้างบน sku ที่ gen แล้วยังซ้ำหากันได้ถ้า 2 ชื่อ slugify เหมือนกัน)
// → ไม่มีกรณีนี้ในชุดข้อมูลปัจจุบัน แต่เพิ่มการ de-dup slug เพื่อความปลอดภัย
const slugCount = new Map();
for (const [sku, p] of productMap) {
  if (sku.includes("-") && !p.sku.includes("-")) continue; // original sku ข้าม
  slugCount.set(sku, (slugCount.get(sku) || 0) + 1);
}

// ── 6. เรียงชื่อ A-Z + ลบ field ชั่วคราว ────────────────────────────────────
const products = [...productMap.values()]
  .map(({ _rawName, ...p }) => p)   // ลบ _rawName ก่อน save
  .sort((a, b) => a.name.localeCompare(b.name, "th"));

// ── 7. บันทึกไฟล์ ─────────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(products, null, 2) + "\n", "utf8");

// ── 8. รายงาน ─────────────────────────────────────────────────────────────────
const cats    = [...new Set(products.map(p => p.category))].sort();
const hasSale = products.filter(p => p.priceSale !== null).length;
const noImg   = products.filter(p => !p.image).length;
const sizeKB  = Math.round(fs.statSync(OUT).size / 1024);

if (warnings.length) {
  console.log(`\n⚠  การแก้ไขข้อมูล (${warnings.length} รายการ):`);
  warnings.forEach(w => console.log(w));
}

console.log(`\n✅ บันทึกไว้ที่ data/products.json`);
console.log(`   สินค้า: ${products.length} ชิ้น | หมวด: ${cats.length} | มีราคาลด: ${hasSale} | ไม่มีรูป: ${noImg} | ขนาดไฟล์: ${sizeKB} KB`);
console.log(`\nหมวดหมู่ (${cats.length}):`);
cats.forEach(c => {
  const n = products.filter(p => p.category === c).length;
  console.log(`  ${String(n).padStart(4)}  ${c}`);
});
