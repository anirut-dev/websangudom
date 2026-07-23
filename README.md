# แสงอุดม ไลท์ติ้ง เซ็นเตอร์ — เว็บไซต์ (Sang Udom Lighting Centre)

เว็บแคตตาล็อกสินค้า + ระบบจัดการหลังบ้าน
ทดแทนบริการสำเร็จรูป itopplus (~7,000 บาท/ปี)

**GitHub:** anirut-dev/websangudom
**โฟลเดอร์:** `C:\Users\IT\Desktop\arm-it desktop\websangudom`

---

## โครงสร้างไฟล์

```
websangudom/
├── index.html              # หน้าแรก + แคตตาล็อกสินค้า
├── about.html              # ความเป็นมา / 8 สาขา / แผนที่ / ติดต่อ
├── admin.html              # Login + จัดการสินค้า (Firebase)
├── css/style.css           # สไตล์ทั้งหมด (พรีเมียม โทนดำ-ทอง)
├── js/
│   ├── firebase-config.js  # Firebase config
│   ├── data.js             # หมวดหมู่ + สินค้าตัวอย่าง (fallback)
│   ├── main.js             # แคตตาล็อก ดึงข้อมูลจาก Firestore
│   └── admin.js            # Login + CRUD สินค้าผ่าน Firestore
└── images/                 # รูปสินค้า (เพิ่มทีหลัง)
```

---

## วิธีเปิดดูเว็บ

ต้องรัน local server (Firebase ไม่ทำงานกับ file://)

```bash
cd "C:\Users\IT\Desktop\arm-it desktop\websangudom"
python -m http.server 8000
```

เปิดเบราว์เซอร์:
- หน้าแรก → http://localhost:8000
- Admin    → http://localhost:8000/admin.html

---

## Firebase

| บริการ | รายละเอียด |
|--------|-----------|
| โปรเจค | websangudom (Spark — ฟรี ไม่ผูกบัตร) |
| Firestore | เก็บสินค้า (collection: `products`) |
| Auth | Email/Password — zonparamgd5@gmail.com |
| Storage | ไม่ใช้ — รูปเก็บใน `images/` (ถอยกลับ 2026-07-02 เพราะ Storage ต้องอัปเกรด Blaze plan/ผูกบัตร ขัดกับเงื่อนไข "ฟรี ไม่ผูกบัตร") |

---

## สถานะปัจจุบัน

| ส่วน | สถานะ |
|------|--------|
| แคตตาล็อกสินค้า (Firestore real-time) | ✅ พร้อม |
| ระบบ Login จริง (Firebase Auth) | ✅ พร้อม — ทดสอบแล้ว |
| เพิ่ม/แก้/ลบสินค้า (Firestore) | ✅ พร้อม |
| ใส่รูปสินค้าใน admin | ✅ กรอก path/URL เอง (เช่น `images/ชื่อไฟล์.webp`) — วางไฟล์ใน `images/` แล้ว push git ก่อนใช้จริง |
| ข้อมูลซิงค์ทุกเครื่อง | ✅ พร้อม |
| หน้าสาขา 8 สาขา + Google Maps | ✅ พร้อม |
| ข้อมูลติดต่อจริง | ✅ พร้อม (เบอร์อ่างทอง/แม่ริมครบ, รังสิตใช้เบอร์กลาง + 095-367-4209) |
| หน้า Gallery (รูปจริงจาก portfolio) | ✅ เสร็จแล้ว |
| โซนโปรโมชั่นหน้าแรก (`#promotion`) | ✅ เสร็จแล้ว (2026-06-30) — static HTML, ต้องแก้มือทุกครั้งที่เพิ่มรูป |
| ดีไซน์ พรีเมียม โทนดำ-ทอง | ✅ เสร็จแล้ว |
| โลโก้ SANG UDOM ทุกหน้า | ✅ เสร็จแล้ว |
| รูปสินค้าจริงในสินค้าแต่ละชิ้น | ⏳ ลูกค้ายังต้องเตรียมรูป, dev ต้องวางไฟล์ใน `images/` แล้ว push ให้ทุกครั้ง |
| Deploy ออนไลน์ (GitHub Pages) | ✅ เพิ่ม domain `anirut-dev.github.io` เข้า Firebase Auth authorized domains แล้ว (2026-07-02) |

---

## ประวัติการแก้ไข (Recent Fixes)

| วันที่ | เรื่อง | รายละเอียด |
|--------|--------|-----------|
| 2026-07-23 | Error handling & Code cleanup | ✅ เพิ่ม error logging ในฟังก์ชันออกจากระบบ + รวม UI reset logic เป็นฟังก์ชันเดียว (commit 289c31c) |

---

## ค้างอยู่ — ต้องเตือนเจ้าของ

- ⚠️ เบอร์โทรสาขารังสิตยังใช้เบอร์กลาง 02-901-3000 (เป็นสำนักงานใหญ่ ถูกต้องแล้ว) — อ่างทอง และ แม่ริม ได้เบอร์จริงแล้ว
- ⚠️ footer หน้าแรก LINE ยังเป็น @sangudom (ยังไม่ได้แก้เป็นข้อมูลจริง)
- 💡 อนาคตถ้าจะจดโดเมนจริง `www.sangudom.com` — ต้องตั้ง DNS ชี้มา GitHub Pages + เพิ่ม custom domain ใน repo settings + เพิ่ม domain นี้เข้า Firebase Auth authorized domains อีกรายการ (ไม่กระทบของเดิม เพิ่มคู่กันได้)
- 🔒 เรื่อง security check (เทสก่อน push ทุกครั้ง ฯลฯ) — ผู้ใช้ขอพักไว้คุยรอบหน้า

---

## ขั้นตอนถัดไป

1. **รูปสินค้า:** วางไฟล์ใน `images/` → กรอก path ในช่อง "รูปภาพสินค้า" ของฟอร์ม admin → push ขึ้น git
2. พิจารณาจดโดเมน `www.sangudom.com` ในอนาคต (ไม่ด่วน)

---

## Push งานขึ้น GitHub

```bash
git add .
git commit -m "อธิบายว่าแก้อะไร"
git push
```
