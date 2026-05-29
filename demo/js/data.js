/* ============================================
   HLLC E-Commerce — Data Models
   Default products list, provinces, mock orders
   ============================================ */

/* ─── Mock Inventory & Orders Data Models ────────────────────────── */
const DEFAULT_PRODUCTS = [
  { id: "mock-9", name: "ชุดกันฝน Premium All-Weather Pro", description: "ชุดกันฝนเกรดส่งออก ดีไซน์สะท้อนแสงรอบตัว 360 องศา ระบายอากาศยอดเยี่ยม กันน้ำกันลม 100%", price: 690, originalPrice: 950, stock: 20, category: "ชุดกันฝน", gradient: "from-rose-500 to-red-700", emoji: "🧥", imageUrl: "https://picsum.photos/seed/allweather1/400/400", imageUrls: ["https://picsum.photos/seed/allweather1/400/400", "https://picsum.photos/seed/allweather2/400/400", "https://picsum.photos/seed/allweather3/400/400"], variants: [{ name: "ขนาด", options: ["M", "L", "XL", "XXL"] }, { name: "สีสะท้อนแสง", options: ["สีส้มสว่าง", "สีเขียวนีออน", "สีดำหรู"] }], rating: 5.0, sold: 99, active: true },
  { id: "mock-1", name: "เสื้อกันฝน Classic", description: "กันน้ำ 100% เนื้อผ้าเบา มีฮูด ใส่ง่าย", price: 290, originalPrice: 390, stock: 15, category: "เสื้อกันฝน", gradient: "from-blue-500 to-blue-700", emoji: "🧥", imageUrl: "https://picsum.photos/seed/raincoat1/400/400", imageUrls: ["https://picsum.photos/seed/raincoat1/400/400", "https://picsum.photos/seed/raincoat1b/400/400", "https://picsum.photos/seed/raincoat1c/400/400"], variants: [{ name: "ขนาด", options: ["S", "M", "L", "XL"] }, { name: "สี", options: ["สีแดง", "สีน้ำเงิน", "สีเหลือง"] }], rating: 4.8, sold: 234, active: true },
  { id: "mock-2", name: "ร่มพับ Ultra Light", description: "พับ 3 ตอน น้ำหนักเพียง 280g กระทัดรัด", price: 180, stock: 30, category: "ร่ม", gradient: "from-sky-400 to-sky-600", emoji: "☂️", imageUrl: "https://picsum.photos/seed/umbrella2/400/400", imageUrls: ["https://picsum.photos/seed/umbrella2/400/400", "https://picsum.photos/seed/umbrella2b/400/400"], variants: [{ name: "สี", options: ["สีกรมท่า", "สีครีม", "สีชมพู"] }], rating: 4.5, sold: 412, active: true },
  { id: "mock-3", name: "ชุดกันฝน Pro Set", description: "เสื้อ + กางเกง กันน้ำ กันลม ครบชุด", price: 550, originalPrice: 680, stock: 8, category: "ชุดกันฝน", gradient: "from-indigo-500 to-indigo-700", emoji: "🥋", imageUrl: "https://picsum.photos/seed/rainsuit3/400/400", rating: 4.9, sold: 156, active: true },
  { id: "mock-4", name: "ร่มกอล์ฟ XL", description: "เส้นผ่านศูนย์กลาง 130cm คุ้มแดดคุ้มฝน", price: 380, stock: 12, category: "ร่ม", gradient: "from-cyan-500 to-blue-600", emoji: "⛱️", imageUrl: "https://picsum.photos/seed/golf4/400/400", rating: 4.6, sold: 89, active: true },
  { id: "mock-5", name: "เสื้อกันฝน Reflective", description: "ติดแถบสะท้อนแสง ปลอดภัยขับมอเตอร์ไซค์", price: 490, originalPrice: 590, stock: 6, category: "เสื้อกันฝน", gradient: "from-blue-400 to-cyan-600", emoji: "🦺", imageUrl: "https://picsum.photos/seed/jacket5/400/400", rating: 4.7, sold: 78, active: true },
  { id: "mock-6", name: "ปอนโช กันฝน", description: "สวมทับได้ทันที เหมาะสำหรับปั่นจักรยาน", price: 220, stock: 20, category: "ชุดกันฝน", gradient: "from-teal-400 to-teal-600", emoji: "🌧️", imageUrl: "https://picsum.photos/seed/poncho6/400/400", rating: 4.3, sold: 167, active: true },
  { id: "mock-7", name: "รองเท้ากันน้ำ", description: "วัสดุ EVA อย่างดี กันน้ำ 100% ทนทาน", price: 590, originalPrice: 750, stock: 5, category: "รองเท้า", gradient: "from-blue-600 to-indigo-700", emoji: "👢", imageUrl: "https://picsum.photos/seed/boots7/400/400", rating: 4.8, sold: 203, active: true },
  { id: "mock-8", name: "หมวกกันฝน ปีกรอบ", description: "วัสดุกันน้ำ ปีกกว้างคุ้มแดดคุ้มฝน", price: 150, stock: 25, category: "อุปกรณ์", gradient: "from-sky-500 to-blue-600", emoji: "🎩", imageUrl: "https://picsum.photos/seed/hat8/400/400", rating: 4.2, sold: 312, active: true }
];

const DEFAULT_ORDERS = [
  {
    id: "DEMO-001",
    customer: { name: "Best Rakdee", phone: "081-234-5678", address: "123 ถ.สุขุมวิท แขวงคลองเตย กรุงเทพมหานคร 10110" },
    items: [{ productId: "mock-1", name: "เสื้อกันฝน Classic", price: 290, quantity: 2, subtotal: 580 }],
    total: 580,
    status: "payment_review",
    slip: { imageUrl: "https://picsum.photos/seed/slip1/400/600", amount: 580, status: "pending" },
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: "DEMO-002",
    customer: { name: "Smaet Jaidee", phone: "089-876-5432", address: "456 ถ.เพชรบุรี แขวงมักกะสัน กรุงเทพมหานคร 10400" },
    items: [
      { productId: "mock-2", name: "ร่มพับ Ultra Light", price: 180, quantity: 1, subtotal: 180 },
      { productId: "mock-4", name: "ร่มกอล์ฟ XL", price: 380, quantity: 1, subtotal: 380 }
    ],
    total: 560,
    status: "shipped",
    slip: { imageUrl: "https://picsum.photos/seed/slip2/400/600", amount: 560, status: "approved" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: "DEMO-003",
    customer: { name: "Aut Meesuk", phone: "062-111-9999", address: "รับเองที่ D1 — เวลา 14:00 น." },
    items: [{ productId: "mock-3", name: "ชุดกันฝน Pro Set", price: 550, quantity: 1, subtotal: 550 }],
    total: 550,
    status: "payment_review",
    slip: { imageUrl: "https://picsum.photos/seed/slip3/400/600", amount: 550, status: "pending" },
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
  },
  {
    id: "DEMO-004",
    customer: { name: "Best Sadsai", phone: "095-555-0001", address: "789 ถ.ลาดพร้าว แขวงจตุจักร กรุงเทพมหานคร 10900" },
    items: [{ productId: "mock-7", name: "รองเท้ากันน้ำ", price: 590, quantity: 1, subtotal: 590 }],
    total: 590,
    status: "shipped",
    slip: { imageUrl: "https://picsum.photos/seed/slip4/400/600", amount: 590, status: "approved" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  }
];

const PROVINCES = [
  "กรุงเทพมหานคร","กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น",
  "จันทบุรี","ฉะเชิงเทรา","ชลบุรี","ชัยนาท","ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่",
  "ตรัง","ตราด","ตาก","นครนายก","นครปฐม","นครพนม","นครราชสีมา","นครศรีธรรมราช",
  "นครสวรรค์","นนทบุรี","นราธิวาส","น่าน","บึงกาฬ","บุรีรัมย์","ปทุมธานี",
  "ประจวบคีรีขันธ์","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา","พะเยา","พังงา",
  "พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์","แพร่","ภูเก็ต","มหาสารคาม",
  "มุกดาหาร","แม่ฮ่องสอน","ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง","ราชบุรี",
  "ลพบุรี","ลำปาง","ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา","สตูล",
  "สมุทรปราการ","สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี",
  "สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี","สุรินทร์","หนองคาย","หนองบัวลำภู",
  "อ่างทอง","อำนาจเจริญ","อุดรธานี","อุตรดิตถ์","อุทัยธานี","อุบลราชธานี"
];

