# เว็บไซต์ สงวนดม ไลท์ติ้ง (Sangudom Lighting)

เว็บไซต์ร้านจำหน่ายโคมไฟ — แคตตาล็อกสินค้า + ระบบจัดการสินค้าหลังบ้าน
สร้างขึ้นเพื่อทดแทนบริการเว็บสำเร็จรูป (itopplus) ที่มีค่าใช้จ่ายรายปี ~7,000 บาท

## โครงสร้างไฟล์

```
websangudom/
├── index.html              # หน้าแรก + แคตตาล็อกสินค้า
├── about.html              # ความเป็นมา / 8 สาขา / แผนที่ / ติดต่อ
├── admin.html              # หน้า Login + จัดการสินค้า (Firebase)
├── css/
│   └── style.css           # สไตล์ทั้งหมด (โทนดำ-ทอง)
├── js/
│   ├── firebase-config.js  # Firebase config (Firestore + Auth)
│   ├── data.js             # หมวดหมู่ + สินค้าตัวอย่าง (fallback)
│   ├── main.js             # แคตตาล็อก ดึงข้อมูลจาก Firestore
│   └── admin.js            # Login Firebase Auth + จัดการสินค้า Firestore
├── images/                 # โฟลเดอร์เก็บรูปสินค้า
└── .gitignore
```

## วิธีเปิดดูเว็บ (ต้องรัน local server)

Firebase ไม่ทำงานกับการเปิดไฟล์ตรงๆ ต้องรันผ่าน server:

```bash
cd "C:\Users\IT\Desktop\arm-it desktop\websangudom"
python -m http.server 8000
```

จากนั้นเปิดเบราว์เซอร์:
- หน้าแรก: http://localhost:8000
- หน้า admin: http://localhost:8000/admin.html

## Firebase

- **โปรเจค:** websangudom (Spark plan — ฟรี ไม่ต้องผูกบัตร)
- **Firestore:** เก็บข้อมูลสินค้า (collection: `products`)
- **Authentication:** Email/Password — user: zonparamgd5@gmail.com
- **Storage:** ไม่ใช้ — รูปเก็บในโฟลเดอร์ images/ แทน

## สถานะปัจจุบัน ✅

| ส่วน | สถานะ |
|------|--------|
| แคตตาล็อกสินค้า (ดึงจาก Firestore real-time) | ✅ พร้อม |
| ระบบ Login จริง (Firebase Auth) | ✅ พร้อม |
| เพิ่ม/แก้ไข/ลบสินค้า บันทึกใน Firestore | ✅ พร้อม |
| ข้อมูลซิงค์ทุกเครื่องอัตโนมัติ | ✅ พร้อม |
| หน้าสาขา 8 สาขา + Google Maps | ✅ พร้อม |
| ข้อมูลติดต่อจริง (เบอร์/LINE/FB) | ✅ พร้อม |
| รูปสินค้าจริง | ⏳ ยังใช้อิโมจิแทน |
| โลโก้จริง / แบนเนอร์ | ⏳ ยังไม่ได้ทำ |
| ทดสอบ Firebase login จริง | ⏳ รอทดสอบ |

## ค้างอยู่ — ต้องเตือนเจ้าของ

- เบอร์โทร 3 สาขายังใช้เบอร์กลาง 02-901-3000: **รังสิต, อ่างทอง, แม่ริม**
- ยังไม่ได้ทดสอบ Firebase login จริงในเบราว์เซอร์

## ขั้นตอนต่อไป

1. ทดสอบ Firebase: รัน `python -m http.server 8000` → เปิด admin.html → login → เพิ่มสินค้า
2. ใส่รูปสินค้าจริง (วางใน images/ แล้วแก้ค่า image ในฐานข้อมูล)
3. ปรับโลโก้ / แบนเนอร์หน้าแรก
4. Deploy ขึ้น GitHub Pages หรือ Netlify (ฟรี)

## วิธี push งานขึ้น GitHub

```bash
git add .
git commit -m "อธิบายว่าแก้อะไร"
git push
```
