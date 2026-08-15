#!/usr/bin/env node
// scripts/build-pages.mjs
// สร้าง:
//   products/<slug>/index.html  — หนึ่งหน้าต่อหมวด (static, embed product cards)
//   sitemap.xml
// รัน: node scripts/build-pages.mjs

import fs   from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir    = path.dirname(fileURLToPath(import.meta.url));
const ROOT     = path.join(__dir, "..");
const LINE_URL = "https://line.me/ti/p/~Sangudom-sale";
const SITE_URL = "https://www.sangudom.com";

// ── โหลดข้อมูลสินค้า ──────────────────────────────────────────────────────────
const products = JSON.parse(fs.readFileSync(path.join(ROOT, "data/products.json"), "utf8"));

// ── slug ──────────────────────────────────────────────────────────────────────
const SLUG_OVERRIDES = {
  "LED Bulb /Downlight LED หลอดไฟ และดาวน์ไลท์ LED": "led-bulb-downlight",
  "Step Light Line ไฟเส้น LED": "step-light-line",
  "Step Light โคมไฟทางเดิน": "step-light-path",
  "Step Light โคมไฟฝังพื้น": "step-light-floor",
};

function catSlug(cat) {
  if (SLUG_OVERRIDES[cat]) return SLUG_OVERRIDES[cat];
  return cat
    .replace(/[฀-๿]/g, " ")   // ตัดอักษรไทย
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ชื่อไทยสำหรับ title/h1 — ใช้ส่วนไทยถ้ามี ไม่งั้นใช้ทั้งหมด
function thName(cat) {
  const m = cat.match(/[฀-๿][฀-๿\s]+/);
  return m ? m[0].trim() : cat;
}

// ── price HTML ────────────────────────────────────────────────────────────────
function priceHtml(p) {
  const regular = "฿" + Number(p.price).toLocaleString("th-TH");
  if (!p.priceSale) return `<span class="product-price">${regular}</span>`;
  const sale = "฿" + Number(p.priceSale).toLocaleString("th-TH");
  return `<span class="product-price"><span class="price-sale">${sale}</span><span class="price-original">${regular}</span></span>`;
}

// path รูปสำหรับหน้า /products/<slug>/ — ต้องถอย 2 ชั้น ถ้าเป็น path local
function imgSrc(image) {
  if (!image) return "";
  return image.startsWith("http") ? image : `../../${image}`;
}

// ── card HTML (static, no JS interaction) ────────────────────────────────────
function cardHtml(p) {
  const skuLine = p.skuAuto ? "" : `\n      <div class="product-sku-label">รหัสสินค้า: ${escHtml(p.sku)}</div>`;
  return `    <div class="product-card">
      <div class="product-img-wrap">
        <img src="${escHtml(imgSrc(p.image))}" alt="${escHtml(p.name)}" loading="lazy" width="400" height="400" />
      </div>
      <div class="product-info">
        <div class="product-name">${escHtml(p.name)}</div>${skuLine}
        ${priceHtml(p)}
      </div>
    </div>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── JSON-LD ItemList ──────────────────────────────────────────────────────────
function jsonLdItemList(cat, catProducts) {
  const slug  = catSlug(cat);
  const title = thName(cat);
  const items = catProducts.slice(0, 50).map((p, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "item": {
      "@type": "Product",
      "name": p.name,
      "image": p.image.startsWith("http") ? p.image : `${SITE_URL}/${p.image}`,
      "offers": {
        "@type": "Offer",
        "price": String(p.priceSale ?? p.price),
        "priceCurrency": "THB",
        "availability": "https://schema.org/InStock",
        "seller": { "@type": "Organization", "name": "แสงอุดม ไลท์ติ้ง เซ็นเตอร์" }
      }
    }
  }));
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": title,
    "url": `${SITE_URL}/products/${slug}/`,
    "numberOfItems": catProducts.length,
    "itemListElement": items,
  }, null, 2);
}

// ── ลิงก์ไปหมวดอื่น (แก้ปัญหา orphan page — ให้ 24 หน้าลิงก์หากันเอง) ──────────
function otherCatLinks(currentCat) {
  return categories
    .filter(c => c !== currentCat)
    .map(c => `        <a class="cat-more-link" href="../${catSlug(c)}/">${escHtml(thName(c))} <span>(${countByCat[c]})</span></a>`)
    .join("\n");
}

// ── template หน้า category ────────────────────────────────────────────────────
function pageHtml(cat, catProducts) {
  const slug  = catSlug(cat);
  const title = thName(cat);
  const count = catProducts.length;
  const cards = catProducts.map(cardHtml).join("\n");
  const firstImg = catProducts[0]?.image ?? "";
  const ogImg = firstImg
    ? (firstImg.startsWith("http") ? firstImg : `${SITE_URL}/${firstImg}`)
    : `${SITE_URL}/images/banner1.webp`;
  const pageUrl = `${SITE_URL}/products/${slug}/`;
  const desc = `${escHtml(title)} จำนวน ${count} รายการ — แสงอุดม ไลท์ติ้ง เซ็นเตอร์ โคมไฟและอุปกรณ์แสงสว่างครบวงจร`;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)} — ${count} รายการ | แสงอุดม ไลท์ติ้ง</title>
  <meta name="description" content="${desc}" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type"        content="website" />
  <meta property="og:locale"      content="th_TH" />
  <meta property="og:site_name"   content="แสงอุดม ไลท์ติ้ง เซ็นเตอร์" />
  <meta property="og:url"         content="${pageUrl}" />
  <meta property="og:title"       content="${escHtml(title)} — ${count} รายการ | แสงอุดม ไลท์ติ้ง" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image"       content="${escHtml(ogImg)}" />
  <meta property="og:image:alt"   content="${escHtml(title)}" />
  <script type="application/ld+json">
${jsonLdItemList(cat, catProducts)}
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../css/style.css" />
  <style>
    .cat-hero { padding: 60px 0 40px; border-bottom: 1px solid var(--border); margin-bottom: 36px; }
    .cat-breadcrumb { font-size: .78rem; color: var(--gray); letter-spacing: .06em; margin-bottom: 10px; }
    .cat-breadcrumb a { color: var(--gray); text-decoration: none; transition: color .2s; }
    .cat-breadcrumb a:hover { color: var(--gold); }
    .cat-sub { font-size: .84rem; color: var(--gray); margin-top: 8px; }
    .cat-sub strong { color: var(--gold); }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--gold); text-decoration: none; font-size: .84rem; margin-bottom: 28px; transition: opacity .2s; }
    .back-link:hover { opacity: .7; }
    .cat-line-cta { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 48px 24px; background: var(--dark-card); border: 1px solid var(--border); margin: 48px 0; text-align: center; }
    .cat-line-cta p { color: var(--gray-light); font-size: .95rem; }
    .cat-line-btn { display: inline-flex; align-items: center; gap: 10px; padding: 14px 32px; background: #06C755; border-radius: 4px; color: #fff; font-family: inherit; font-size: 1rem; font-weight: 700; text-decoration: none; transition: opacity .2s, transform .2s; }
    .cat-line-btn:hover { opacity: .9; transform: translateY(-2px); }
    .cat-more { margin: 52px 0 0; }
    .cat-more-title { font-size: 1.05rem; margin-bottom: 14px; }
    .cat-more-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .cat-more-link {
      padding: 8px 14px;
      background: var(--dark-card);
      border: 1px solid var(--border);
      color: var(--gray-light);
      font-size: .84rem;
      text-decoration: none;
      transition: background .2s, border-color .2s, color .2s;
    }
    .cat-more-link:hover { background: var(--dark-3); border-color: var(--gold); color: var(--gold); }
  </style>
</head>
<body>

  <header class="site-header">
    <div class="container header-inner">
      <a href="../../index.html" class="logo">
        <img src="../../images/logo.png" alt="Sang Udom LED Lighting" class="logo-img" width="1093" height="730" />
      </a>
      <button type="button" class="nav-toggle" id="navToggle" aria-label="เมนู" aria-expanded="false" aria-controls="mainNav">☰</button>
      <nav class="main-nav" id="mainNav">
        <a href="../../index.html"><span class="nav-en">Home</span><span class="nav-th">หน้าแรก</span></a>
        <a href="../../index.html#promotion"><span class="nav-en">Promotion</span><span class="nav-th">โปรโมชั่น</span></a>
        <a href="../../products.html" class="active"><span class="nav-en">Products</span><span class="nav-th">สินค้า</span></a>
        <a href="../../gallery.html"><span class="nav-en">Portfolio</span><span class="nav-th">ผลงาน</span></a>
        <a href="../../about.html"><span class="nav-en">About</span><span class="nav-th">เกี่ยวกับเรา</span></a>
        <a href="../../branches.html"><span class="nav-en">Branches</span><span class="nav-th">สาขา</span></a>
        <a href="../../branches.html#contact"><span class="nav-en">Contact</span><span class="nav-th">ติดต่อ</span></a>
      </nav>
    </div>
  </header>

  <div class="container">
    <div class="cat-hero">
      <nav class="cat-breadcrumb" aria-label="breadcrumb">
        <a href="../../index.html">หน้าแรก</a> /
        <a href="../../products.html">สินค้าทั้งหมด</a> /
        ${escHtml(title)}
      </nav>
      <h1>${escHtml(title)}</h1>
      <p class="cat-sub">พบ <strong>${count}</strong> รายการ</p>
    </div>

    <a class="back-link" href="../../products.html">← ดูสินค้าทั้งหมด</a>

    <div class="product-grid">
${cards}
    </div>

    <nav class="cat-more" aria-label="หมวดหมู่สินค้าอื่น">
      <h2 class="cat-more-title">ดูหมวดอื่น</h2>
      <div class="cat-more-grid">
${otherCatLinks(cat)}
      </div>
    </nav>

    <div class="cat-line-cta">
      <p>สนใจสินค้าหมวด "${escHtml(title)}"?<br />สอบถามราคา สั่งจอง หรือขอใบเสนอราคาได้เลย</p>
      <a class="cat-line-btn" href="${LINE_URL}" target="_blank" rel="noopener noreferrer">
        💬 สอบถามราคาทาง LINE
      </a>
    </div>
  </div>

  <footer class="site-footer">
    <div class="container footer-body">
      <div>
        <div class="footer-brand-logo"><a href="../../index.html" class="logo"><img src="../../images/logo.png" alt="Sang Udom LED Lighting" class="logo-img" width="1093" height="730" /></a></div>
        <p class="footer-company-name">Sang Udom Lighting Centre Co., Ltd.</p>
        <div class="footer-info-row"><span class="fi-icon">📍</span><p>14/11 หมู่ 1 ถนนพหลโยธิน ต.คลองหนึ่ง<br />อ.คลองหลวง จ.ปทุมธานี 12120</p></div>
        <div class="footer-info-row"><span class="fi-icon">📞</span><p><a href="tel:029013000">02-901-3000</a> / <a href="tel:0953674209">095-367-4209</a></p></div>
        <div class="footer-info-row"><span class="fi-icon">✉</span><p><a href="mailto:sangudomlight@gmail.com">sangudomlight@gmail.com</a></p></div>
        <div class="footer-info-row"><span class="fi-icon">💬</span><p><a href="${LINE_URL}" target="_blank" rel="noopener noreferrer">LINE: @Sangudom-sale</a></p></div>
      </div>
      <div>
        <div class="footer-col-title">หมวดหมู่สินค้า</div>
        <div class="footer-links">
          <a href="../../products.html">สินค้าทั้งหมด</a>
        </div>
      </div>
      <div>
        <div class="footer-col-title">เวลาทำการ</div>
        <p class="footer-hours">ทุกวัน 09:00 – 18:00 น.<br /><br />สาขาทั่วประเทศ 8 สาขา<br />ภาคกลาง · ภาคเหนือ · ภาคอีสาน</p>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container">
        <span class="footer-copyright">© 2026 www.sangudom.com — All Rights Reserved</span>
      </div>
    </div>
  </footer>

  <script src="../../js/animations.js"></script>
  <script src="../../js/line-float.js"></script>
  <script>
    const t = document.getElementById("navToggle");
    const n = document.getElementById("mainNav");
    if (t) t.addEventListener("click", () => {
      const open = n.classList.toggle("open");
      t.setAttribute("aria-expanded", String(open));
    });
  </script>
</body>
</html>`;
}

// ── สร้าง category pages ──────────────────────────────────────────────────────
const categories = [...new Set(products.map(p => p.category))].sort();
const countByCat = Object.fromEntries(
  categories.map(c => [c, products.filter(p => p.category === c).length])
);
let built = 0;

for (const cat of categories) {
  const slug  = catSlug(cat);
  const items = products.filter(p => p.category === cat);
  const dir   = path.join(ROOT, "products", slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), pageHtml(cat, items), "utf8");
  built++;
  process.stdout.write(`  [${String(built).padStart(2)}] ${slug.padEnd(30)} ${items.length} รายการ\n`);
}

// ── ฝังลิงก์หมวดลง products.html (ระหว่าง marker CAT-LINKS) ───────────────────
// ทำให้หน้าหมวด 24 หน้าไม่เป็น orphan page — มีลิงก์จริงจากหน้าแคตตาล็อกชี้ไป
const CAT_START = "<!-- CAT-LINKS:START -->";
const CAT_END   = "<!-- CAT-LINKS:END -->";
const catLinksHtml = categories
  .map(cat =>
    `        <a class="cat-link-card" href="products/${catSlug(cat)}/">` +
    `<span>${escHtml(thName(cat))}</span>` +
    `<span class="cat-link-count">${countByCat[cat]}</span></a>`
  )
  .join("\n");

const productsPath = path.join(ROOT, "products.html");
const productsSrc  = fs.readFileSync(productsPath, "utf8");
const catBlockRe   = new RegExp(`${CAT_START}[\\s\\S]*?${CAT_END}`);

if (catBlockRe.test(productsSrc)) {
  fs.writeFileSync(
    productsPath,
    productsSrc.replace(catBlockRe, `${CAT_START}\n${catLinksHtml}\n        ${CAT_END}`),
    "utf8"
  );
  process.stdout.write(`\n  ✓ products.html — ฝังลิงก์หมวด ${categories.length} หมวด\n`);
} else {
  process.stdout.write(`\n  ⚠ ไม่พบ marker ${CAT_START} ใน products.html — ข้ามการฝังลิงก์\n`);
}

// ── sitemap.xml ───────────────────────────────────────────────────────────────
const today = new Date().toISOString().split("T")[0];

const staticUrls = [
  { url: "/",              prio: "1.0", freq: "weekly"  },
  { url: "/products.html", prio: "0.9", freq: "weekly"  },
  { url: "/about.html",    prio: "0.6", freq: "monthly" },
  { url: "/branches.html", prio: "0.7", freq: "monthly" },
  { url: "/gallery.html",  prio: "0.5", freq: "monthly" },
];

const catUrls = categories.map(cat => ({
  url:  `/products/${catSlug(cat)}/`,
  prio: "0.8",
  freq: "weekly",
}));

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...catUrls].map(({ url, prio, freq }) =>
`  <url>
    <loc>${SITE_URL}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>
  </url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemapXml, "utf8");

console.log(`\n✅ ${built} category pages + sitemap.xml`);
console.log(`   slugs ที่ override: led-bulb-downlight, step-light-line, step-light-path, step-light-floor`);
