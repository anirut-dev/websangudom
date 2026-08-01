// ===== โครงสร้างหมวดหมู่สินค้า =====
// ต้องตรงกับค่า "category" ใน data/products.json ทุกตัว (24 หมวด)
// หมวดย่อยห้ามซ้ำข้ามกลุ่มใหญ่ — checkbox ใช้ชื่อหมวดเป็น state เดียวกัน
// ถ้าซ้ำ ติ๊กที่หนึ่งจะไปติ๊กอีกที่โดยผู้ใช้ไม่รู้ตัว

const CATEGORY_TREE = [
  { main: "Exterior Lamp", subs: [
    "Gate Lamp โคมไฟหัวเสา",
    "Wall Lamp โคมไฟผนัง",
    "Garden Lamp โคมไฟสนาม",
    "Street Light โคมไฟถนน",
    "Step Light โคมไฟทางเดิน",
    "Accent Light โคมไฟปักดิน",
  ]},
  { main: "Interior Lamp", subs: [
    "Ceiling Lamp โคมไฟเพดาน",
    "Pendant Lamp โคมไฟช่อ โคมไฟห้อย",
    "Table Floor Lamp โคมไฟตั้งโต๊ะ และตั้งพื้น",
    "Downlight Tracklight ดาวน์ไลท์ และแทรคไลท์",
    "Step Light โคมไฟฝังพื้น",
    "T-Bar Fluorescent ไฟทีบาร์ และฟลูออเรสเซนต์",
    "High Bay โคมไฮเบย์",
  ]},
  { main: "Chandelier", subs: [
    "Pendant Crystal Lamp โคมไฟช่อ และไฟเพดาน",
    "Wall Crystal Lamp โคมไฟกิ่ง",
    "Chat Crystal Lamp โคมไฟฉัตร",
  ]},
  { main: "LED", subs: [
    "LED Bulb /Downlight LED หลอดไฟ และดาวน์ไลท์ LED",
    "Step Light Line ไฟเส้น LED",
    "Spotlight Floodlight โคมไฟสปอร์ตไลท์ และฟลัดไลท์",
    "Street Garden Light โคมไฟถนน และไฟสวน",
  ]},
  { main: "Bulb Accessories", subs: [
    "Bulb หลอดไฟ",
    "Accessories อุปกรณ์เสริม",
  ]},
  { main: "Other Products", subs: [] },
  { main: "Solar cell", subs: [] },
];

const CATEGORIES = CATEGORY_TREE.flatMap(g => g.subs.length ? g.subs : [g.main]);

