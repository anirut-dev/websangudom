# แสงอุดม ไลท์ติ้ง เซ็นเตอร์ — เว็บไซต์ v2

เว็บแคตตาล็อกสินค้า static ไม่มี backend
ทดแทนบริการสำเร็จรูป itopplus (~7,000 บาท/ปี)

**GitHub:** https://github.com/anirut-dev/websangudom
**Live:** https://anirut-dev.github.io/websangudom (หลัง merge เข้า main)

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
├── data/
│   └── products.json       # ข้อมูลสินค้า 792 ชิ้น ← แก้ที่นี่
├── css/style.css           # สไตล์ทั้งหมด (โทนดำ-ทอง)
├── js/
│   ├── products.js         # โหลด JSON, filter, search, pagination
│   ├── data.js             # CATEGORY_TREE constant
│   ├── line-float.js       # floating LINE button
│   └── animations.js       # scroll reveal animations
├── images/                 # รูปสินค้า + banner + portfolio
├── scripts/
│   ├── export-firestore.mjs  # ดึงข้อมูลจาก Firestore (ใช้ครั้งเดียวตอน migrate)
│   └── build-pages.mjs       # สร้างหน้าหมวด + sitemap
├── sitemap.xml
├── robots.txt
├── HANDOVER.md             # คู่มือส่งมอบงาน (อ่านก่อนแก้เว็บ)
└── .github/workflows/
    └── deploy-pages.yml    # build → deploy เมื่อ push เข้า main
```

---

## วิธีเปิดดูเว็บ (local)

```bash
cd "C:\Users\IT\Desktop\arm-it desktop\websangudom"
python -m http.server 8787
```

เปิดเบราว์เซอร์ที่ http://localhost:8787

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
| Deploy GitHub Pages | ✅ (merge เข้า main แล้ว auto-deploy) |
| Google Search Console | ⏳ เจ้าของต้องทำเอง — ยืนยันเว็บ + ส่ง sitemap |
| Google Business Profile | ⏳ เจ้าของต้องทำเอง |
| โดเมน sangudom.com | ⏳ ซื้อได้ทีหลัง ~500–800 บาท/ปี |

---

## Branches

| Branch | ความหมาย |
|--------|---------|
| `main` | Production — deploy อัตโนมัติเมื่อ push |
| `v2-static` | งานพัฒนา v2 (merge เข้า main แล้ว) |

---

## ข้อจำกัดถาวร

> **ห้ามผูกบัตรเครดิตกับบริการใดๆ โดยไม่ถามก่อน**
> ทุกบริการต้องอยู่ใน free tier ที่อนุญาตให้ใช้เชิงพาณิชย์
