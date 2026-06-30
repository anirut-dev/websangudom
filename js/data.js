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
    "LED Bulb / Downlight LED หลอดไฟ และดาวน์ไลท์ LED",
    "LED Ceiling Lamp โคมไฟเพดาน LED",
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

const SAMPLE_PRODUCTS = [
  { id: "p001", name: "โคมไฟผนังภายนอก ทรงโมเดิร์น", category: "Wall Lamp โคมไฟผนัง", price: 890, emoji: "🏮", image: "images/test-a-1.JPG", desc: "โคมไฟผนังกันน้ำ IP65 ดีไซน์เรียบหรู เหมาะกับหน้าบ้าน รั้ว ทางเดิน" },
  { id: "p002", name: "โคมไฟสนามหญ้า LED", category: "Garden Lamp โคมไฟสนาม", price: 650, emoji: "🌿", image: "images/test-a-1.JPG", desc: "เสาไฟสนามสูง 60 ซม. แสงวอร์มไวท์ ทนแดดทนฝน" },
  { id: "p003", name: "โคมไฟเพดานดาวน์ไลท์ 9W", category: "Downlight Tracklight ดาวน์ไลท์ และแทรคไลท์", price: 220, emoji: "💡", image: "images/test-b-1.jpg", desc: "ดาวน์ไลท์ฝังฝ้า แสงขาว/วอร์ม ประหยัดไฟ อายุการใช้งานยาวนาน" },
  { id: "p004", name: "โคมไฟแขวนเพดาน สไตล์ลอฟท์", category: "Pendant Lamp โคมไฟช่อ โคมไฟห้อย", price: 1450, emoji: "🪔", image: "images/test-b-1.jpg", desc: "โคมแขวนโลหะสีดำด้าน เหมาะกับร้านกาแฟ เคาน์เตอร์ครัว" },
  { id: "p005", name: "แชนเดอเลียร์คริสตัล 8 กิ่ง", category: "Pendant Crystal Lamp โคมไฟช่อ และไฟเพดาน", price: 8900, emoji: "✨", image: "images/test-c-1.jpg", desc: "โคมระย้าคริสตัลแท้ หรูหรา เหมาะกับห้องรับแขก โถงบันได" },
  { id: "p006", name: "โคมไฟกิ่งคริสตัล ติดผนัง", category: "Wall Crystal Lamp โคมไฟกิ่ง", price: 5600, emoji: "💎", image: "images/test-c-1.jpg", desc: "ระย้าวงแหวน LED ปรับแสงได้ ดีไซน์ร่วมสมัย" },
  { id: "p007", name: "หลอด LED 7W E27 (แพ็ค 4)", category: "LED Bulb / Downlight LED หลอดไฟ และดาวน์ไลท์ LED", price: 180, emoji: "🔆", image: "images/test-d-1.jpg", desc: "หลอดประหยัดไฟ ขั้ว E27 แสงเดย์ไลท์ รับประกัน 1 ปี" },
  { id: "p008", name: "โคมฟลัดไลท์ 50W กันน้ำ", category: "Spotlight Floodlight โคมไฟสปอร์ตไลท์ และฟลัดไลท์", price: 420, emoji: "🔦", image: "images/test-d-1.jpg", desc: "สปอตไลท์กลางแจ้ง กันน้ำ ส่องป้าย ลานจอดรถ" },
  { id: "p009", name: "อุปกรณ์รางไฟ + สวิตช์หรี่แสง", category: "Accessories อุปกรณ์เสริม", price: 350, emoji: "🔌", image: "images/test-a-1.JPG", desc: "อุปกรณ์เสริมสำหรับติดตั้งระบบไฟ ปรับความสว่างได้" },
  { id: "p010", name: "โคมไฟตั้งโต๊ะ ไม้+ผ้า", category: "Table Floor Lamp โคมไฟตั้งโต๊ะ และตั้งพื้น", price: 990, emoji: "🛋️", image: "images/test-b-1.jpg", desc: "โคมตั้งโต๊ะหัวเตียง โทนอบอุ่น ตกแต่งห้องนอนได้สวยงาม" },
  { id: "p011", name: "ไฟเส้น LED Strip 5 เมตร", category: "Step Light Line ไฟเส้น LED", price: 290, emoji: "🌈", image: "images/test-d-1.jpg", desc: "ไฟเส้นยืดหยุ่น ติดได้ทุกที่ เปลี่ยนสีได้ พร้อมรีโมท" },
  { id: "p012", name: "โคมไฟหัวเสาทางเข้าบ้าน", category: "Gate Lamp โคมไฟหัวเสา", price: 1200, emoji: "💫", image: "images/test-a-1.JPG", desc: "โคมหัวเสาประตูบ้าน กันสนิม ทนแดดทนฝน" },
];
