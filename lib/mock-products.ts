export type MockProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  gradient: string;
  emoji: string;
  imageUrl?: string;
  rating: number;
  sold: number;
};

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "mock-1",
    name: "เสื้อกันฝน Classic",
    description: "กันน้ำ 100% เนื้อผ้าเบา มีฮูด ใส่ง่าย",
    price: 290,
    stock: 15,
    category: "เสื้อกันฝน",
    gradient: "from-blue-500 to-blue-700",
    emoji: "🧥",
    imageUrl: "https://picsum.photos/seed/raincoat1/400/400",
    rating: 4.8,
    sold: 234,
  },
  {
    id: "mock-2",
    name: "ร่มพับ Ultra Light",
    description: "พับ 3 ตอน น้ำหนักเพียง 280g กระทัดรัด",
    price: 180,
    stock: 30,
    category: "ร่ม",
    gradient: "from-sky-400 to-sky-600",
    emoji: "☂️",
    imageUrl: "https://picsum.photos/seed/umbrella2/400/400",
    rating: 4.5,
    sold: 412,
  },
  {
    id: "mock-3",
    name: "ชุดกันฝน Pro Set",
    description: "เสื้อ + กางเกง กันน้ำ กันลม ครบชุด",
    price: 550,
    stock: 8,
    category: "ชุดกันฝน",
    gradient: "from-indigo-500 to-indigo-700",
    emoji: "🥋",
    imageUrl: "https://picsum.photos/seed/rainsuit3/400/400",
    rating: 4.9,
    sold: 156,
  },
  {
    id: "mock-4",
    name: "ร่มกอล์ฟ XL",
    description: "เส้นผ่านศูนย์กลาง 130cm คุ้มแดดคุ้มฝน",
    price: 380,
    stock: 12,
    category: "ร่ม",
    gradient: "from-cyan-500 to-blue-600",
    emoji: "⛱️",
    imageUrl: "https://picsum.photos/seed/golf4/400/400",
    rating: 4.6,
    sold: 89,
  },
  {
    id: "mock-5",
    name: "เสื้อกันฝน Reflective",
    description: "ติดแถบสะท้อนแสง ปลอดภัยขับมอเตอร์ไซค์",
    price: 490,
    stock: 6,
    category: "เสื้อกันฝน",
    gradient: "from-blue-400 to-cyan-600",
    emoji: "🦺",
    imageUrl: "https://picsum.photos/seed/jacket5/400/400",
    rating: 4.7,
    sold: 78,
  },
  {
    id: "mock-6",
    name: "ปอนโช กันฝน",
    description: "สวมทับได้ทันที เหมาะสำหรับปั่นจักรยาน",
    price: 220,
    stock: 20,
    category: "ชุดกันฝน",
    gradient: "from-teal-400 to-teal-600",
    emoji: "🌧️",
    imageUrl: "https://picsum.photos/seed/poncho6/400/400",
    rating: 4.3,
    sold: 167,
  },
  {
    id: "mock-7",
    name: "รองเท้ากันน้ำ",
    description: "วัสดุ EVA อย่างดี กันน้ำ 100% ทนทาน",
    price: 590,
    stock: 5,
    category: "รองเท้า",
    gradient: "from-blue-600 to-indigo-700",
    emoji: "👢",
    imageUrl: "https://picsum.photos/seed/boots7/400/400",
    rating: 4.8,
    sold: 203,
  },
  {
    id: "mock-8",
    name: "หมวกกันฝน ปีกรอบ",
    description: "วัสดุกันน้ำ ปีกกว้างคุ้มแดดคุ้มฝน",
    price: 150,
    stock: 25,
    category: "อุปกรณ์",
    gradient: "from-sky-500 to-blue-600",
    emoji: "🎩",
    imageUrl: "https://picsum.photos/seed/hat8/400/400",
    rating: 4.2,
    sold: 312,
  },
];
