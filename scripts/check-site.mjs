#!/usr/bin/env node
// scripts/check-site.mjs
// เช็คความถูกต้องของเว็บก่อน deploy — ไม่ใช้ไลบรารีเสริม
//   1) data/products.json: field ครบ, ราคาเป็นตัวเลข, SKU ไม่ซ้ำ
//   2) รูปสินค้า (path ในเครื่อง) มีไฟล์จริงทุกชิ้น
//   3) ลิงก์/รูปภายในทุกหน้า HTML ชี้ไปไฟล์ที่มีอยู่ และไม่ใช้ path ขึ้นต้นด้วย "/"
//      (เว็บจริงอยู่ที่ subpath /websangudom/ — absolute path จะพังเงียบๆ)
// รันหลัง build: node scripts/build-pages.mjs && node scripts/check-site.mjs
// ผิดอย่างน้อย 1 ข้อ → exit code 1 (CI ล้ม)

import fs   from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const fail = msg => errors.push(msg);

// ── 1) ข้อมูลสินค้า ───────────────────────────────────────────────────────────
const products = JSON.parse(fs.readFileSync(path.join(ROOT, "data/products.json"), "utf8"));
const seenSku = new Map();

products.forEach((p, i) => {
  const label = `products.json[${i}] ${p.sku || p.name || "?"}`;
  for (const f of ["name", "sku", "category", "image"]) {
    if (!p[f]) fail(`${label}: ไม่มี field "${f}"`);
  }
  if (!(Number(p.price) > 0)) fail(`${label}: price ไม่ใช่ตัวเลขที่มากกว่า 0 (${p.price})`);
  if (p.priceSale && !(Number(p.priceSale) < Number(p.price))) {
    fail(`${label}: priceSale (${p.priceSale}) ต้องน้อยกว่า price (${p.price})`);
  }
  if (p.sku) {
    if (seenSku.has(p.sku)) fail(`${label}: SKU ซ้ำกับรายการ [${seenSku.get(p.sku)}]`);
    else seenSku.set(p.sku, i);
  }

  // ── 2) ไฟล์รูป ──────────────────────────────────────────────────────────────
  if (p.image && !/^https?:\/\//.test(p.image) && !fs.existsSync(path.join(ROOT, p.image))) {
    fail(`${label}: ไม่พบไฟล์รูป ${p.image}`);
  }
});

// ── 3) ลิงก์ในหน้า HTML ───────────────────────────────────────────────────────
const SKIP_DIRS = new Set([".git", ".github", "node_modules", "docs", "stock-check", "scripts"]);

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : htmlFiles(full);
    return e.name.endsWith(".html") ? [full] : [];
  });
}

const ATTR_RE = /\b(?:href|src)\s*=\s*"([^"]*)"/g;
let pagesChecked = 0;

for (const file of htmlFiles(ROOT)) {
  pagesChecked++;
  const rel  = path.relative(ROOT, file).replace(/\\/g, "/");
  // ตัดเนื้อหา inline <script> และคอมเมนต์ออก (ไม่ใช่ลิงก์จริง) — แต่เก็บแท็กเปิดไว้ให้ src ยังถูกเช็ค
  const html = fs.readFileSync(file, "utf8")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi, "$1</script>");

  for (const [, raw] of html.matchAll(ATTR_RE)) {
    const url = raw.trim();
    if (!url || url.startsWith("#") || /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(url)) continue;
    if (url.startsWith("/")) { fail(`${rel}: ใช้ absolute path "${url}" (เว็บอยู่ที่ subpath ให้ใช้ path แบบ relative)`); continue; }

    let clean = url.split("#")[0].split("?")[0];
    try { clean = decodeURIComponent(clean); } catch { /* ใช้ค่าเดิม */ }
    if (!clean) continue;

    let target = path.resolve(path.dirname(file), clean);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
    if (!fs.existsSync(target)) fail(`${rel}: ลิงก์/รูปไม่พบไฟล์ "${url}"`);
  }
}

// ── สรุปผล ───────────────────────────────────────────────────────────────────
console.log(`ตรวจสินค้า ${products.length} ชิ้น, หน้า HTML ${pagesChecked} หน้า`);
if (errors.length) {
  console.error(`\n❌ พบปัญหา ${errors.length} จุด:`);
  const shown = errors.slice(0, 50);
  shown.forEach(e => console.error("  - " + e));
  if (errors.length > shown.length) console.error(`  ... และอีก ${errors.length - shown.length} จุด`);
  process.exit(1);
}
console.log("✅ ผ่านทุกข้อ");
