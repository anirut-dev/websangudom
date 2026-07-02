// ===== ข้อมูลสินค้าตัวอย่าง =====
// ในอนาคตข้อมูลส่วนนี้จะดึงมาจาก Firebase แทน
// ตอนนี้ใช้ข้อมูลตัวอย่างเพื่อให้เห็นหน้าตาเว็บทำงานจริง
//
// แต่ละสินค้า: id, name, category, price, emoji (รูปชั่วคราว),
//              image (ใส่ path รูปจริงทีหลัง เช่น "images/lamp01.jpg"), desc

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
    "Wall Lamp โคมไฟผนัง",
    "Table Floor Lamp โคมไฟตั้งโต๊ะ และตั้งพื้น",
    "Downlight Tracklight ดาวน์ไลท์ และแทรคไลท์",
    "Step Light โคมไฟฝังพื้น",
    "T-Bar Fluorescent ไฟทีบาร์ และฟลูออเรสเซนต์",
    "High Bay โคมไฮเบย์",
  ]},
  { main: "Chandelier", subs: [
    "Pendant Crystal Lamp โคมไฟช่อ และไฟเพดาน",
    "Wall Crystal Lamp โคมไฟกิ่ง",
    "Chat Crystal Lamp โคมไฟจัตร",
  ]},
  { main: "LED", subs: [
    "LED Bulb /Downlight LED หลอดไฟ และดาวน์ไลท์ LED",
    "Ceiling Lamp โคมไฟเพดาน",
    "Step Light Line ไฟเส้น LED",
    "Spotlight Floodlight โคมไฟสปอร์ตไลท์ และฟลัดไลท์",
    "Street Garden Light โคมไฟถนน และไฟสวน",
  ]},
  { main: "Bulb Accessories", subs: [
    "Bulb หลอดไฟ",
    "Accessories อุปกรณ์เสริม",
  ]},
  { main: "Furniture", subs: [] },
  { main: "Other Products", subs: [] },
  { main: "Solar cell", subs: [] },
];

const CATEGORIES = CATEGORY_TREE.flatMap(g => g.subs.length ? g.subs : [g.main]);

