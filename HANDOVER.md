# HANDOVER — เว็บแสงอุดม ไลท์ติ้ง เวอร์ชัน 2

> เอกสารนี้เขียนเพื่อคนที่รับงานต่อ ไม่จำเป็นต้องมีความรู้ด้านเว็บ
> อ่านตามลำดับ ทำตามขั้นตอน ไม่ต้องเดา

---

## 1. ภาพรวมเว็บ v2

| รายการ | รายละเอียด |
|--------|-----------|
| **ประเภท** | Static HTML/CSS/JS — ไม่มี backend, ไม่มีฐานข้อมูล |
| **ข้อมูลสินค้า** | `data/products.json` (792 ชิ้น, 24 หมวด) |
| **Hosting** | GitHub Pages (ฟรี, ใช้เชิงพาณิชย์ได้, ไม่ต้องบัตรเครดิต) |
| **Deploy** | push เข้า `main` → GitHub Actions build และ deploy อัตโนมัติ |
| **ติดต่อลูกค้า** | LINE OA: `https://line.me/ti/p/~Sangudom-sale` |

---

## 2. โครงสร้างไฟล์ที่สำคัญ

```
websangudom/
├── data/
│   └── products.json          ← ข้อมูลสินค้าทั้งหมด (แก้ที่นี่เพื่ออัปเดตสินค้า)
├── products/
│   └── <slug>/index.html      ← 24 หน้าหมวดหมู่ (สร้างโดย build script)
├── images/
│   └── products/              ← รูปสินค้า 810 ไฟล์ อยู่ในโปรเจคทั้งหมด (ไม่ได้ใช้บริการนอก)
├── scripts/
│   ├── export-firestore.mjs   ← ดึงข้อมูลจาก Firestore (ใช้ครั้งแรกแล้ว ไม่ได้ใช้อีก)
│   └── build-pages.mjs        ← สร้างหน้าหมวด + sitemap.xml
├── js/
│   ├── products.js            ← โหลด products.json, filter, search, pagination
│   ├── data.js                ← CATEGORY_TREE constant
│   ├── theme.js               ← ปุ่มสลับโหมดมืด/สว่าง (จำค่าใน localStorage)
│   ├── animations.js          ← เอฟเฟกต์ตอนเลื่อนหน้าจอ
│   └── line-float.js          ← floating LINE button
├── 404.html                   ← หน้าไม่พบ (GitHub Pages หยิบไปใช้เอง ไม่ต้องตั้งค่า)
├── sitemap.xml                ← สร้างโดย build script
├── robots.txt
├── docs/
│   ├── V2-PLAN.md             ← spec ของ v2 + เหตุผลเบื้องหลังการตัดสินใจ
│   └── QA-REPORT-*.md         ← ผลตรวจ QA และสิ่งที่แก้ไปแล้ว
└── .github/workflows/
    └── deploy-pages.yml       ← GitHub Actions: node build → deploy
```

---

## 3. วิธีอัปเดตสินค้า (ไม่ต้องลง VS Code)

### 3.1 แก้ไขผ่าน GitHub web editor

1. เปิด https://github.com/anirut-dev/websangudom
2. คลิกที่ไฟล์ `data/products.json`
3. กดปุ่ม ✏️ (Edit) มุมขวาบน
4. หาสินค้าที่ต้องการแก้ (ใช้ Ctrl+F ค้นหาชื่อ)
5. แก้ไขค่าที่ต้องการ เช่น `"price": 1500`
6. เลื่อนลงล่าง กด **"Commit changes"**
7. รอ ~2 นาที GitHub Actions จะ build และ deploy ให้อัตโนมัติ

### 3.2 โครงสร้างข้อมูลสินค้า 1 ชิ้น

```json
{
  "name": "ชื่อสินค้า",
  "sku": "05-001-BK",
  "skuAuto": false,
  "category": "Gate Lamp โคมไฟหัวเสา",
  "price": 1500,
  "priceSale": null,
  "image": "images/products/exterior/garden-lamp/05-5584-BK-J22-2015z-z1314017200462.webp"
}
```

| ฟิลด์ | ความหมาย |
|-------|---------|
| `name` | ชื่อสินค้า |
| `sku` | รหัสสินค้า (ถ้า `skuAuto: true` คือระบบสร้างให้ ไม่แสดงหน้าเว็บ) |
| `category` | หมวดหมู่ — ต้องตรงกับที่มีอยู่ใน `js/data.js` |
| `price` | ราคาปกติ |
| `priceSale` | ราคาลด (ถ้าไม่มีส่วนลด ใส่ `null`) |
| `image` | ที่อยู่ไฟล์รูปในโปรเจค เช่น `images/products/exterior/garden-lamp/xxx.webp` (ไม่ใช่ URL ภายนอก) |

### 3.3 เพิ่มสินค้าใหม่

คัดลอก block ด้านบน แก้ค่า แล้วเพิ่มต่อท้ายในไฟล์ JSON (อย่าลืม `,` ระหว่าง object)

> **ข้อควรระวัง**: JSON ต้องถูก syntax — ถ้า commit แล้ว build fail ให้ดู tab **Actions** ใน GitHub

### 3.4 หลัง commit — GitHub Actions จะ

1. รัน `node scripts/build-pages.mjs` → สร้างหน้าหมวดหมู่ใหม่
2. upload ทุกไฟล์ขึ้น GitHub Pages
3. เว็บ live ภายใน ~2 นาที

---

## 4. วิธี deploy ด้วยตนเอง (กรณีฉุกเฉิน)

```bash
# บน เครื่องที่มี Node.js 18+
git clone https://github.com/anirut-dev/websangudom
cd websangudom
git checkout main
node scripts/build-pages.mjs
git add products/ sitemap.xml
git commit -m "rebuild pages"
git push
```

---

## 5. สิ่งที่เจ้าของต้องทำเอง (Claude ทำแทนไม่ได้)

| # | งาน | ทำที่ไหน | เหตุผล |
|---|-----|---------|--------|
| 1 | **Google Search Console** | https://search.google.com/search-console | ยืนยันเว็บ + ส่ง `sitemap.xml` → ไม่งั้น Google ใช้เวลาหลายเดือนกว่าจะ index |
| 2 | **Google Business Profile** | https://business.google.com | ฟรี ~30 นาที — ร้านไฟค้นผ่าน Maps มากกว่า Google เว็บมาก |
| 3 | **โดเมน sangudom.com** | Namecheap / GoDaddy / Porkbun | ~500–800 บาท/ปี — **ให้บริษัทเป็นเจ้าของ ไม่ใช่พนักงาน** |
| 4 | **LINE Basic ID** | LINE OA Manager → Settings → Account info | ต้องการ `@xxxxxxx` เพื่อให้ oaMessage/pre-fill ทำงานได้ |

---

## 6. ข้อจำกัดที่ยอมรับแล้ว

- **อัปเดตสินค้าต้องผ่าน GitHub** — ไม่มี admin panel (ดูวิธีที่หัวข้อ 3)
- **ไม่มีระบบขอใบเสนอราคาในเว็บ** — ลูกค้าใช้ LINE / โทรแทน
- **รูปใหม่** — ต้อง upload ไฟล์รูปเข้าโปรเจคเองในโฟลเดอร์ `images/products/<หมวด>/` แล้วใส่ path ใน JSON
  (upload ผ่านเว็บ GitHub ได้: เข้าโฟลเดอร์ปลายทาง → ปุ่ม **Add file → Upload files**)
  แนะนำให้แปลงเป็น `.webp` ก่อน ไฟล์จะเล็กลงมาก เว็บโหลดเร็วขึ้น
- **ไม่มี server-side search** — ค้นหาทำงานฝั่ง browser จาก JSON (ดีพอสำหรับ 792 ชิ้น)

---

## 7. ข้อจำกัดถาวรของโปรเจค

> **ห้ามผูกบัตรเครดิตกับบริการใดๆ โดยไม่ถามก่อน**
> ทุกบริการต้องอยู่ใน free tier ที่อนุญาตให้ใช้เชิงพาณิชย์ และไม่ต้องใช้บัตร

---

## 8. ข้อมูล repository

| รายการ | ค่า |
|--------|-----|
| GitHub | https://github.com/anirut-dev/websangudom |
| Branch หลัก | `main` (production — merge เมื่อไหร่ ขึ้นเว็บเมื่อนั้น) |
| GitHub Actions | `.github/workflows/deploy-pages.yml` |

### กฎการแก้เว็บ

> **ห้ามแก้บน `main` ตรงๆ** — ทุกครั้งให้แตก branch ใหม่ แก้เสร็จเปิด PR แล้วค่อย merge
> ตั้งชื่อ branch ตามประเภทงาน: `feat/` ฟีเจอร์ใหม่ · `fix/` แก้บั๊ก · `docs/` เอกสาร · `chore/` งานจิปาถะ
> เปิด PR แล้วจะมีแบบฟอร์มขึ้นมาให้กรอกเอง (`.github/pull_request_template.md`) — กรอกให้ครบ คนรับงานต่อจะได้รู้ว่าแก้อะไรทำไม
> ขั้นตอนเต็มดูใน [README.md](README.md) หัวข้อ Branches

---

## 9. ช่องทางติดต่อเว็บ (ที่ใช้ในโค้ด)

| ช่องทาง | ค่า |
|---------|-----|
| LINE OA | `https://line.me/ti/p/~Sangudom-sale` |
| โทรศัพท์ | 02-901-3000 / 095-367-4209 |
| อีเมล | sangudomlight@gmail.com |
| ที่อยู่ | 14/11 หมู่ 1 ถนนพหลโยธิน ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120 |

ถ้าต้องการเปลี่ยนช่องทางติดต่อ ให้ค้นหาค่าเหล่านี้ใน codebase และแก้ให้ครบทุกจุด
