# V2-PLAN — เว็บแสงอุดม ไลท์ติ้ง เซ็นเตอร์ (เวอร์ชัน 2: Static + SEO)

> **เอกสารนี้คือ spec สุดท้าย** สรุปจากการวางแผนเมื่อ 31 ก.ค. 2026
> ทำงานบน branch `v2-static` — `main` (v1) ยังอยู่ครบ ย้อนกลับได้ตลอด

> ✅ **งานเสร็จแล้ว (1 ส.ค. 2026)** — task 1–8 complete, พร้อม merge เข้า main
> ผลจริง: **792 ชิ้น** (ไม่ใช่ 682), **24 หมวด** (ไม่ใช่ 23)
> สำหรับสถานะปัจจุบัน ดู [README.md](../README.md) และ [HANDOVER.md](../HANDOVER.md)

---

## 1. เป้าหมาย

เปลี่ยนเว็บจาก **v1 (Firebase + admin panel)** → **v2 (static ล้วน ไม่มี backend)**

เหตุผล:
- **SEO** — v1 โหลดสินค้าด้วย JS จาก Firestore → Google bot มองไม่เห็นสินค้าเลย
- **ส่งต่องานง่าย** — ผู้ดูแลคนปัจจุบันจะไม่อยู่ระยะยาว ต้องลด dependency ให้เหลือน้อยที่สุด
- **ลดความเสี่ยง** — ไม่มี Firebase billing, ไม่มี security rules, ไม่มี password หลายชุดให้ส่งต่อ

---

## 2. สถาปัตยกรรม

```
Static HTML/CSS/JS  +  data/products.json
        │
        └── build script (GitHub Actions) → หน้าหมวดหมู่ + sitemap.xml
        │
        └── Deploy → GitHub Pages  (ภายหลังย้าย Cloudflare Pages ได้)
```

**ไม่มี:** backend, database, login, API

---

## 3. Hosting — สรุปที่ตรวจสอบมาแล้ว

| ตัวเลือก | ค่าใช้จ่าย | ใช้เชิงพาณิชย์ | บัตรเครดิต | Bandwidth | สรุป |
|----------|-----------|---------------|-----------|-----------|------|
| **GitHub Pages** (ใช้อยู่) | ฟรี | ✅ ได้ | ไม่ต้อง | 100 GB/เดือน | **ใช้ต่อ** |
| **Cloudflare Pages** | ฟรี | ✅ ได้ | ไม่ต้อง | ไม่จำกัด | ย้ายตอนซื้อโดเมน |
| ~~Vercel Hobby~~ | ฟรี | ❌ **ห้าม** | — | 100 GB | **ตัดทิ้ง** |

### ⚠️ ทำไมไม่ใช้ Vercel
Vercel Hobby ห้ามใช้เชิงพาณิชย์ นิยามของเขากว้างมาก — *"deployment ที่ใช้เพื่อผลประโยชน์ทางการเงินของใครก็ตามที่เกี่ยวข้อง รวมถึงพนักงานที่เขียนโค้ด"* → เว็บบริษัท + คนทำเป็นพนักงาน = เข้าข่าย ต้องขึ้น Pro $20/เดือน
และ Vercel สงวนสิทธิ์ปิด deployment บน Hobby **โดยไม่แจ้งล่วงหน้า** → รับไม่ได้สำหรับ production

### 📌 ข้อเท็จจริงสำคัญ
**SEO ที่ดีขึ้นมาจากการเอาข้อมูลใส่ HTML — ไม่ได้มาจาก host**
ทำ v2 บน GitHub Pages เดิม ได้ SEO เท่ากับ Vercel/Cloudflare ทุกประการ
host มีผลแค่ CDN เร็วกว่า + ต่อโดเมนสะดวกกว่า

---

## 4. สิ่งที่ตรวจสอบแล้วในโปรเจค (31 ก.ค. 2026)

| รายการ | ผล |
|--------|-----|
| `migration/all-import.json` | **682 สินค้า** — มี name / sku / category / price / priceSale / image ครบ พร้อมใช้เป็น `products.json` |
| รูปสินค้า `images/products/` | **810 ไฟล์ / 13 MB** อยู่ใน repo แล้ว (path เป็น local ทั้งหมด) |
| ขนาด repo | 24 MB (+ .git 21 MB) — ห่างจากลิมิต GitHub Pages 1 GB มาก |
| หมวดหมู่ | **23 หมวด** |
| Workflow | `.github/workflows/deploy-pages.yml` deploy ทั้ง repo เมื่อ push เข้า `main` |

### ⚠️ ข้อควรระวัง
JSON มี **682** ชิ้น แต่ Firestore น่าจะมีมากกว่า (ที่เพิ่มผ่าน admin panel ทีหลัง — รูปอยู่บน Cloudinary)
→ **ต้อง export จาก Firestore ครั้งเดียวก่อนปิดระบบ** ให้ได้ข้อมูลครบ แล้วค่อยใช้ `all-import.json` เป็นฐานเทียบ

---

## 5. ขอบเขตฟีเจอร์

### เก็บไว้
- หน้าแนะนำบริษัท / เกี่ยวกับเรา / สาขา / แกลเลอรี่
- แคตตาล็อกสินค้า: **รูป + ชื่อ + รหัส SKU + ราคา**
- ตัวกรองหมวดหมู่ + ค้นหา + pagination (ทำฝั่ง client จาก JSON)
- **LINE เป็นช่องทางหลัก** — ปุ่มแชท, ปุ่มลอย, footer, ปุ่ม "สอบถามราคาทาง LINE" (ระดับเว็บ ไม่ใช่รายสินค้า)
- ข้อมูลติดต่อ: เบอร์โทร, LINE, ที่อยู่, แผนที่

### ตัดออก
| ตัด | ไฟล์ที่เกี่ยวข้อง |
|-----|------------------|
| Admin panel + login | `admin.html`, `js/admin.js` |
| Firebase (Firestore + Auth) | `js/firebase-config.js`, `firestore.rules` |
| Cloudinary upload | (อยู่ใน `js/admin.js`) |
| ระบบตะกร้าขอใบเสนอราคา | `js/quote.js` + ปุ่มขอราคารายสินค้า |
| ไฟล์ migration | `migration/` (ย้าย JSON ออกก่อน) |
| localStorage cache | (ไม่จำเป็นแล้ว เพราะอ่านไฟล์ local) |

---

## 6. แผน SEO

### โครงสร้างหน้า
```
/                          หน้าแรก
/about.html                เกี่ยวกับเรา
/branches.html             สาขา
/gallery.html              ผลงาน
/products.html             สินค้าทั้งหมด (filter + search + pagination)
/products/<หมวด>/          ← 23 หน้าหมวดหมู่ (generate ตอน build) ★ หน้าหลักของ SEO
```

### ⚠️ ทำไมไม่ทำหน้าสินค้ารายชิ้น (682 หน้า)
ข้อมูลสินค้ามีแค่ ชื่อ + SKU + ราคา **ไม่มีคำอธิบาย** → Google มองเป็น *thin content*
อาจไม่ index หรือ index แล้วไม่ติดอันดับ

**ทำหน้าหมวดหมู่แทน** — เนื้อหาแน่นกว่า และตรงกับคำที่คนค้นจริง เช่น
"โคมไฟผนัง", "โคมไฟถนน LED", "ไฟสปอตไลท์"

> หน้าสินค้ารายชิ้น → ทำภายหลังเมื่อมีคำอธิบายสินค้าแล้ว

### ต้องมีทุกหน้า
- `<title>` และ `<meta name="description">` เฉพาะของแต่ละหน้า
- Open Graph (`og:title`, `og:description`, `og:image`) — แชร์ LINE แล้วขึ้นรูปสวย
- `<html lang="th">`
- โครงสร้าง heading ถูกต้อง (h1 เดียวต่อหน้า)

### ต้องสร้าง
- `sitemap.xml` (generate ตอน build)
- `robots.txt`
- **JSON-LD structured data**
  - `LocalBusiness` — ชื่อร้าน ที่อยู่ เบอร์ เวลาทำการ (หน้าแรก)
  - `Product` / `ItemList` — หน้าหมวดหมู่

### รูปภาพ
- ใส่ `alt` เป็นชื่อสินค้าจริง
- ใส่ `width` / `height` กัน layout กระตุก (CLS)
- `loading="lazy"` ทุกรูปที่อยู่ใต้ fold
- ตั้งชื่อไฟล์ให้สื่อความหมาย (Google Images เป็นช่องทางเข้าเว็บ)

---

## 7. ลำดับงาน

| # | งาน | หมายเหตุ |
|---|-----|----------|
| **1** | **Export Firestore → `data/products.json`** | ⚠️ ทำก่อนอื่น — ต้องเข้า Firebase Console ได้ |
| 2 | ลบ Firebase / admin / quote-cart / migration | งาน "ตัดออก" |
| 3 | เขียน `js/products.js` ใหม่ (fetch JSON + filter + search + pagination) | สั้นกว่าเดิมมาก |
| 4 | เขียน build script → 23 หน้าหมวด + `sitemap.xml` | Node script รันใน GitHub Actions |
| 5 | ใส่ meta / OG / JSON-LD ทุกหน้า | |
| 6 | ปุ่ม LINE ทั่วเว็บ + "สอบถามราคาทาง LINE" | |
| 7 | ปรับรูป: alt / width / height / lazy | |
| 8 | `HANDOVER.md` | ★ สำคัญที่สุดสำหรับการส่งมอบ |
| 9 | merge `v2-static` → `main` แล้ว deploy | workflow ยิงเฉพาะ `main` |

---

## 8. สิ่งที่เจ้าของงานต้องทำเอง (Claude ทำแทนไม่ได้)

| # | เรื่อง | หมายเหตุ |
|---|--------|----------|
| 1 | ⚠️ **2SV บัญชี Google** | deadline 10 ก.ค. 2026 **เลยมาแล้ว** — เช็คด่วนว่ายังเข้า Firebase ได้ไหม (ต้องเข้าให้ได้เพื่อทำงานข้อ 1) |
| 2 | **โดเมน `sangudom.com`** | ~500–800 บาท/ปี — **ให้บริษัทเป็นคนซื้อและถือครอง ไม่ใช่ชื่อพนักงาน** (สำคัญมากตอนส่งมอบ) |
| 3 | **Google Business Profile** | ฟรี ~30 นาที — ร้านไฟในไทย ลูกค้าค้น "ร้านไฟ ใกล้ฉัน" → Maps มาก่อนเว็บเสมอ **ได้ผลมากกว่า SEO ทั้งเว็บรวมกัน** |
| 4 | **Google Search Console** | ฟรี — ยืนยันเว็บ + ส่ง sitemap ไม่งั้น Google อาจใช้เวลาหลายเดือนกว่าจะเจอ |
| 5 | **LINE Basic ID** | จาก LINE OA Manager → Settings → Account info (`@xxxxxxx`) เพื่อให้ pre-fill ข้อความทำงาน — **`@Sangudom-sale` ที่ใช้อยู่เป็น vanity ID ใช้กับ oaMessage ไม่ได้** |

---

## 9. ข้อจำกัดที่ยอมรับแล้ว

- **การอัปเดตสินค้าต้องใช้ git** — ไม่มี admin panel แล้ว
  - บรรเทาได้: แก้ `data/products.json` ผ่าน **GitHub web editor** ได้เลย ไม่ต้องลง VS Code
  - ต้องเขียนวิธีทำแบบละเอียดพร้อมรูปใน `HANDOVER.md`
- **ไม่มีระบบขอใบเสนอราคาในเว็บ** — ลูกค้าใช้ LINE / โทร แทน

---

## 10. ข้อจำกัดถาวรของโปรเจค

> **ห้ามผูกบัตรเครดิตกับบริการใดๆ โดยไม่ถามก่อน**
> ทุกบริการที่เพิ่มต้องอยู่ใน free tier ที่ **อนุญาตให้ใช้เชิงพาณิชย์** และ **ไม่ต้องใช้บัตร**

---

## 11. อ้างอิง

- [Vercel — Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)
- [Vercel — Terms of Service](https://vercel.com/legal/terms)
- [GitHub — Terms for Additional Products and Features](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features)
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [Cloudflare Pages](https://pages.cloudflare.com/)
