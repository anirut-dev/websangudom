# แสงอุดม ไลท์ติ้ง เซ็นเตอร์ — เว็บไซต์ v2

เว็บแคตตาล็อกสินค้า static ไม่มี backend
ทดแทนบริการสำเร็จรูป itopplus (~7,000 บาท/ปี)

**GitHub:** https://github.com/anirut-dev/websangudom
**Live:** https://anirut-dev.github.io/websangudom (หลัง merge เข้า main)
**เช็คสต๊อกสินค้า (เครื่องมือชั่วคราว):** https://anirut-dev.github.io/websangudom/stock-check/?v=2 — ดูรายละเอียดใน [stock-check/README.md](stock-check/README.md)

---

## สถาปัตยกรรม

```
Static HTML/CSS/JS  +  data/products.json
        │
        └── scripts/build-pages.mjs (GitHub Actions)
                    │
                    ├── products/<slug>/index.html  (24 หน้าหมวดหมู่)
                    └── sitemap.xml
```

**ไม่มี:** backend, database, login, Firebase, admin panel

---

## โครงสร้างไฟล์

```
websangudom/
├── index.html              # หน้าแรก
├── about.html              # เกี่ยวกับเรา
├── branches.html           # สาขา & ติดต่อ
├── gallery.html            # ผลงานติดตั้ง
├── products.html           # แคตตาล็อก (filter + search + pagination)
├── products/               # 24 หน้าหมวดหมู่ (สร้างโดย build script)
│   └── <slug>/index.html
├── 404.html                # หน้าไม่พบ (GitHub Pages ใช้อัตโนมัติ)
├── data/
│   └── products.json       # ข้อมูลสินค้า 792 ชิ้น ← แก้ที่นี่
├── css/style.css           # สไตล์ร่วมของทุกหน้า (โทนขาว-น้ำเงิน-แดง + โหมดมืด)
├── js/
│   ├── products.js         # โหลด JSON, filter, search, pagination
│   ├── data.js             # CATEGORY_TREE constant
│   ├── theme.js            # ปุ่มสลับโหมดมืด/สว่าง (จำค่าใน localStorage)
│   ├── line-float.js       # floating LINE button
│   └── animations.js       # scroll reveal animations
├── images/                 # รูปสินค้า 810 ไฟล์ + banner + portfolio (อยู่ในโปรเจคทั้งหมด)
├── scripts/
│   ├── export-firestore.mjs  # ดึงข้อมูลจาก Firestore (ใช้ครั้งเดียวตอน migrate)
│   └── build-pages.mjs       # สร้างหน้าหมวด + sitemap
├── sitemap.xml
├── robots.txt
├── HANDOVER.md             # คู่มือส่งมอบงาน (อ่านก่อนแก้เว็บ)
├── docs/
│   ├── V2-PLAN.md          # spec ของ v2 (เหตุผลเบื้องหลังการตัดสินใจ)
│   └── QA-REPORT-*.md      # ผลตรวจ QA + สิ่งที่แก้ไปแล้ว
└── .github/
    ├── pull_request_template.md   # แบบฟอร์มที่ขึ้นมาเองตอนเปิด PR
    └── workflows/deploy-pages.yml # build → deploy เมื่อ push เข้า main
```

> ⚠️ **`css/style.css` ไม่ได้คุมทุกอย่าง** — แต่ละหน้ามี `<style>` ของตัวเองใน `<head>` ที่เขียนทับ style.css ได้
> เช่น hero ของหน้าแรก (slideshow, overlay, สีตัวหนังสือ) คุมจาก `<style>` ใน `index.html` ล้วน ๆ
> ถ้าแก้ style.css แล้วหน้าไม่เปลี่ยน ให้ไปหาใน `<style>` ของหน้านั้นก่อน

---

## วิธีเปิดดูเว็บ (local)

```bash
cd "C:\Users\IT\Desktop\arm-it desktop\websangudom"
python -m http.server 8787
```

เปิดเบราว์เซอร์ที่ http://localhost:8787 (กด `Ctrl+C` ในหน้าต่างคำสั่งเพื่อปิด server)

> เปิดไฟล์ด้วยการดับเบิลคลิก (`file://`) จะเพี้ยน — `products.html` โหลด `products.json` ไม่ได้
> ต้องเปิดผ่าน server เสมอ

---

## วิธีอัปเดตสินค้า

แก้ไฟล์ `data/products.json` แล้ว push — GitHub Actions จะ build และ deploy ให้อัตโนมัติ

ดูวิธีละเอียดได้ใน [HANDOVER.md](HANDOVER.md)

---

## สถานะปัจจุบัน (v2)

| ส่วน | สถานะ |
|------|--------|
| แคตตาล็อกสินค้า (โหลดจาก JSON) | ✅ พร้อม |
| 24 หน้าหมวดหมู่ (static, SEO) | ✅ พร้อม |
| Meta / Open Graph / JSON-LD | ✅ พร้อม |
| sitemap.xml + robots.txt | ✅ พร้อม |
| ปุ่ม LINE ทั่วเว็บ (floating + footer) | ✅ พร้อม |
| รูปสินค้า alt/width/height/lazy | ✅ พร้อม |
| หน้า 404 กำหนดเอง | ✅ พร้อม |
| โหมดมืด/สว่าง (ปุ่มในหัวเว็บทุกหน้า) | ✅ พร้อม — จำค่าที่เลือกไว้ ค่าเริ่มต้นตามเครื่องผู้ใช้ |
| ลิงก์ไปหน้าหมวดจาก `products.html` | ✅ พร้อม — แก้ปัญหา orphan page |
| ลิงก์ไปหน้าหมวดจาก `index.html` | ⏳ ยังไม่ทำ (หน้าแรกน้ำหนัก SEO สูงสุด) |
| `<link rel="canonical">` | ⏳ เขียนโค้ดเสร็จแล้ว (PR #39 draft) — รอซื้อโดเมนก่อนถึง merge ได้ |
| ตรวจ QA ครบทุกหน้า | ✅ ปิดครบทุกข้อ — ดู [QA report](docs/QA-REPORT-2026-08-01.md) |
| Deploy GitHub Pages | ✅ (merge เข้า main แล้ว auto-deploy) |
| Google Search Console | ⏳ เจ้าของต้องทำเอง — ยืนยันเว็บ + ส่ง sitemap |
| Google Business Profile | ⏳ เจ้าของต้องทำเอง |
| โดเมน sangudom.com | ⏳ ซื้อได้ทีหลัง ~500–800 บาท/ปี |

---

## Branches

| Branch | ความหมาย |
|--------|---------|
| `main` | Production — deploy อัตโนมัติเมื่อ push (**ห้ามแก้ตรงๆ**) |

งาน v2 merge เข้า `main` ครบแล้ว branch `v2-static` ถูกลบทิ้ง

### วิธีทำงานต่อ — 1 งาน 1 branch

```bash
git switch main
git pull                          # ดึงของใหม่ก่อนเสมอ ไม่งั้นเจอ merge conflict
git switch -c feat/ชื่องาน         # feat / fix / docs / chore

# ...แก้โค้ด... แล้วเปิดดูในเบราว์เซอร์ก่อน (ดูหัวข้อ "วิธีเปิดดูเว็บ" ด้านบน)

git add -u                        # ⚠️ ใช้ -u ไม่ใช่ -A (เหตุผลข้างล่าง)
git status                        # ดูให้ชัดว่ามีอะไรจะถูก commit บ้าง
git commit -m "feat(ส่วนที่แก้): อธิบายสั้นๆ ว่าทำอะไร ทำไม"
git push -u origin feat/ชื่องาน

gh pr create --base main --title "..." --body-file <ไฟล์คำอธิบาย>
gh pr merge <เลข PR> --merge --delete-branch    # merge + ลบ branch ทั้งในเครื่องและบน GitHub
```

**⚠️ ทำไมต้อง `git add -u` ไม่ใช่ `git add -A`**
`-A` เก็บ**ทุกไฟล์**รวมไฟล์ใหม่ที่ยังไม่เคยเข้า git (untracked) → ไฟล์ทดสอบ/ไฟล์ขยะที่วางค้างไว้จะติดเข้า commit ไปด้วย
`-u` เก็บเฉพาะไฟล์ที่ git ตามอยู่แล้วและถูกแก้ → ปลอดภัยกว่ามาก
ถ้าแก้ไฟล์เดียว ระบุชื่อไฟล์ตรงๆ ชัดที่สุด: `git add index.html`
กลับกัน ถ้า**ตั้งใจเพิ่มไฟล์ใหม่จริงๆ** `-u` จะไม่เก็บให้ ต้องระบุชื่อไฟล์ใหม่นั้นเอง เช่น `git add js/ไฟล์ใหม่.js`

**ก่อน merge ทุกครั้ง:** เปิดดูในเบราว์เซอร์จริง + ดู tab "Files changed" ใน PR ว่ามีแต่ไฟล์ที่ตั้งใจแก้
merge เข้า `main` แล้วขึ้นเว็บจริงทันที ไม่มีขั้นตอนให้ทบทวนอีก

**ถ้าแก้ `scripts/build-pages.mjs` หรือ template ในนั้น** ต้องรัน `node scripts/build-pages.mjs` แล้ว commit ผลลัพธ์ด้วย
(หน้าหมวด 24 หน้า + `sitemap.xml` + บล็อกลิงก์หมวดใน `products.html` สร้างจากสคริปต์นี้ — **ห้ามแก้มือ**)

---

## ข้อจำกัดถาวร

> **ห้ามผูกบัตรเครดิตกับบริการใดๆ โดยไม่ถามก่อน**
> ทุกบริการต้องอยู่ใน free tier ที่อนุญาตให้ใช้เชิงพาณิชย์
