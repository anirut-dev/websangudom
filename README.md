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
| Storage | ไม่ใช้ — รูปเก็บใน images/ |

---

## สถานะปัจจุบัน

| ส่วน | สถานะ |
|------|--------|
| แคตตาล็อกสินค้า (Firestore real-time) | ✅ พร้อม |
| ระบบ Login จริง (Firebase Auth) | ✅ พร้อม — ทดสอบแล้ว |
| เพิ่ม/แก้/ลบสินค้า (Firestore) | ✅ พร้อม |
| ข้อมูลซิงค์ทุกเครื่อง | ✅ พร้อม |
| หน้าสาขา 8 สาขา + Google Maps | ✅ พร้อม |
| ข้อมูลติดต่อจริง | ✅ พร้อม |
| ดีไซน์ พรีเมียม โทนดำ-ทอง | ✅ เสร็จแล้ว |
| โลโก้ SANG UDOM ทุกหน้า | ✅ เสร็จแล้ว |
| รูปสินค้าจริง | ⏳ รอรวบรวมรูป |
| Deploy ออนไลน์ (Netlify/GitHub Pages) | ⏳ ยังไม่ได้ทำ |

---

## ค้างอยู่ — ต้องเตือนเจ้าของ

- ⚠️ เบอร์โทร 3 สาขายังใช้เบอร์กลาง 02-901-3000: **รังสิต, อ่างทอง, แม่ริม (เชียงใหม่)**
- ⚠️ footer หน้าแรก LINE ยังเป็น @sangudom (ยังไม่ได้แก้เป็นข้อมูลจริง)

---

## ขั้นตอนถัดไป

1. **C — รูปสินค้า:** วางรูปใน `images/` → อัปเดตค่า `image` ใน Firestore
2. **E — Deploy:** เอาขึ้น Netlify (ฟรี) ให้คนเข้าจากอินเตอร์เน็ตได้

---

## Push งานขึ้น GitHub

```bash
git add .
git commit -m "อธิบายว่าแก้อะไร"
git push
```
