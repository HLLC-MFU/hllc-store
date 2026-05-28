"use client";

import * as React from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Image as ImageIcon,
  Package,
  PackagePlus,
  Pencil,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type OrderStatus =
  | "pending_payment" | "payment_review" | "paid"
  | "packing" | "shipped" | "completed" | "cancelled";

type SlipStatus = "none" | "pending" | "approved" | "rejected";

type Product = {
  id: string; name: string; slug: string;
  description?: string; price: number; stock: number;
  discount?: number; // percent 0-100
  imageUrl?: string; active: boolean;
};

type Order = {
  id: string;
  customer: { name: string; phone: string; address: string };
  items: { productId: string; name: string; price: number; quantity: number; subtotal: number }[];
  total: number;
  status: OrderStatus;
  slip: { imageUrl?: string; amount?: number; status: SlipStatus };
  createdAt: string;
};

/* ─── Mock Data ───────────────────────────────────────────────────────────── */

const MOCK_ORDERS: Order[] = [
  {
    id: "demo-001",
    customer: { name: "Best Rakdee", phone: "081-234-5678", address: "123 ถ.สุขุมวิท แขวงคลองเตย กรุงเทพมหานคร 10110" },
    items: [{ productId: "mock-1", name: "เสื้อกันฝน Classic", price: 290, quantity: 2, subtotal: 580 }],
    total: 580,
    status: "payment_review",
    slip: { imageUrl: "https://picsum.photos/seed/slip1/400/600", amount: 580, status: "pending" },
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "demo-002",
    customer: { name: "Smaet Jaidee", phone: "089-876-5432", address: "456 ถ.เพชรบุรี แขวงมักกะสัน กรุงเทพมหานคร 10400" },
    items: [
      { productId: "mock-2", name: "ร่มพับ Ultra Light", price: 180, quantity: 1, subtotal: 180 },
      { productId: "mock-4", name: "ร่มกอล์ฟ XL", price: 380, quantity: 1, subtotal: 380 },
    ],
    total: 560,
    status: "paid",
    slip: { imageUrl: "https://picsum.photos/seed/slip2/400/600", amount: 560, status: "approved" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "demo-003",
    customer: { name: "Aut Meesuk", phone: "062-111-9999", address: "รับเองที่ D1 — เวลา 14:00 น." },
    items: [{ productId: "mock-3", name: "ชุดกันฝน Pro Set", price: 550, quantity: 1, subtotal: 550 }],
    total: 550,
    status: "pending_payment",
    slip: { status: "none" },
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: "demo-004",
    customer: { name: "Best Sadsai", phone: "095-555-0001", address: "789 ถ.ลาดพร้าว แขวงจตุจักร กรุงเทพมหานคร 10900" },
    items: [{ productId: "mock-7", name: "รองเท้ากันน้ำ", price: 590, quantity: 1, subtotal: 590 }],
    total: 590,
    status: "packing",
    slip: { imageUrl: "https://picsum.photos/seed/slip4/400/600", amount: 590, status: "approved" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

const ORDER_STATUSES: OrderStatus[] = [
  "pending_payment", "payment_review", "paid", "packing", "shipped", "completed", "cancelled",
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function money(v: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(v);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "เมื่อกี้";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  return `${Math.floor(h / 24)} วันที่แล้ว`;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "รอชำระ",
  payment_review: "รอตรวจสลิป",
  paid: "ชำระแล้ว",
  packing: "กำลังแพ็ก",
  shipped: "จัดส่งแล้ว",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-700 border-amber-200",
  payment_review: "bg-orange-100 text-orange-700 border-orange-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  packing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

/* ─── Main ────────────────────────────────────────────────────────────────── */

export function AdminPresentation() {
  const [orders, setOrders] = React.useState<Order[]>(MOCK_ORDERS);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "all">("all");
  const [toast, setToast] = React.useState("");
  const [confirm, setConfirm] = React.useState<{ orderId: string; approved: boolean } | null>(null);
  const [lightbox, setLightbox] = React.useState<string | null>(null);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const pendingSlips = orders.filter((o) => o.slip.status === "pending");
  const filteredOrders = orders.filter((o) => statusFilter === "all" || o.status === statusFilter);

  function approveSlip(orderId: string, approved: boolean) {
    setConfirm({ orderId, approved });
  }

  function confirmApprove() {
    if (!confirm) return;
    setOrders((prev) => prev.map((o) =>
      o.id === confirm.orderId
        ? { ...o, status: confirm.approved ? "paid" : o.status, slip: { ...o.slip, status: confirm.approved ? "approved" : "rejected" } }
        : o
    ));
    notify(confirm.approved ? "✓ อนุมัติสลิปแล้ว" : "✗ ปฏิเสธสลิปแล้ว");
    setConfirm(null);
  }

  function updateStatus(orderId: string, status: OrderStatus) {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  }

  function addProduct(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    const discount = Number(formData.get("discount")) || undefined;
    setProducts((prev) => [{
      id: `p-${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      description: String(formData.get("description") ?? "").trim() || undefined,
      price: Number(formData.get("price")) || 0,
      stock: Number(formData.get("stock")) || 0,
      discount,
      imageUrl: String(formData.get("imageUrl") ?? "").trim() || undefined,
      active: true,
    }, ...prev]);
    notify("เพิ่มสินค้าแล้ว");
  }

  function updateProduct(updated: Product) {
    setProducts((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    notify("อัปเดตสินค้าแล้ว");
  }

  function deleteProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    notify("ลบสินค้าแล้ว");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-3">{confirm.approved ? "✅" : "❌"}</div>
              <h3 className="font-bold text-lg text-gray-900">
                {confirm.approved ? "ยืนยันการอนุมัติ?" : "ยืนยันการปฏิเสธ?"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {confirm.approved
                  ? "สลิปจะถูกอนุมัติ และ status เปลี่ยนเป็น paid"
                  : "สลิปจะถูกปฏิเสธ กรุณาแจ้งลูกค้าใหม่"}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={confirmApprove}
                className={`flex-1 py-3 rounded-2xl text-sm font-bold text-white ${confirm.approved ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}>
                {confirm.approved ? "อนุมัติ" : "ปฏิเสธ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">
            <XCircle className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="slip" className="max-w-full max-h-[90vh] rounded-2xl object-contain" />
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#85241F] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">HLLC Admin</span>
          </div>
          <div className="flex items-center gap-2">
            {pendingSlips.length > 0 && (
              <span className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                รอตรวจ {pendingSlips.length} รายการ
              </span>
            )}
            <span className="text-xs text-gray-400 hidden sm:block">
              {orders.length} orders · {products.length} products
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-6">
        <Tabs defaultValue="orders">
          <TabsList className="w-full grid grid-cols-2 bg-white border border-gray-100 rounded-2xl p-1 h-auto shadow-sm">
            <TabsTrigger value="orders" className="h-10 rounded-xl data-[state=active]:bg-[#85241F] data-[state=active]:text-white gap-2">
              <ClipboardList className="w-4 h-4" />
              คำสั่งซื้อ
              {pendingSlips.length > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingSlips.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="products" className="h-10 rounded-xl data-[state=active]:bg-[#85241F] data-[state=active]:text-white gap-2">
              <Package className="w-4 h-4" />
              สินค้า
            </TabsTrigger>
          </TabsList>

          {/* ── Orders Tab ── */}
          <TabsContent value="orders" className="mt-4 flex flex-col gap-5">

            {/* Zone 1: Pending slip review */}
            {pendingSlips.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <h2 className="font-bold text-gray-900">รอตรวจสลิป ({pendingSlips.length})</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {pendingSlips.map((order) => (
                    <SlipReviewCard key={order.id} order={order} onApprove={approveSlip} onViewSlip={setLightbox} />
                  ))}
                </div>
              </div>
            )}

            {/* Zone 2: All orders */}
            <div>
              <h2 className="font-bold text-gray-900 mb-3">คำสั่งซื้อทั้งหมด</h2>

              {/* Status filter chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
                {(["all", ...ORDER_STATUSES] as const).map((s) => {
                  const count = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
                  if (count === 0 && s !== "all") return null;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`shrink-0 h-8 px-3 rounded-full text-xs font-medium border transition-colors ${
                        statusFilter === s
                          ? "bg-[#85241F] text-white border-[#85241F]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#85241F]/30"
                      }`}
                    >
                      {s === "all" ? "ทั้งหมด" : STATUS_LABEL[s as OrderStatus]} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2">
                {filteredOrders.map((order) => (
                  <OrderRow key={order.id} order={order} onStatusChange={updateStatus} />
                ))}
                {filteredOrders.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-8">ไม่มีคำสั่งซื้อ</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Products Tab ── */}
          <TabsContent value="products" className="mt-4 flex flex-col gap-4">
            <AddProductForm onSubmit={addProduct} notify={notify} />
            {products.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} onUpdate={updateProduct} onDelete={deleteProduct} />
                ))}
              </div>
            )}
            {products.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">ยังไม่มีสินค้า — เพิ่มได้ด้านบน</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

/* ─── Slip Review Card ───────────────────────────────────────────────────── */

function SlipReviewCard({ order, onApprove, onViewSlip }: {
  order: Order;
  onApprove: (id: string, approved: boolean) => void;
  onViewSlip: (url: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
      <div className="flex gap-4 p-4">
        {/* Slip image — กดดูรูปเต็ม */}
        <button
          onClick={() => order.slip.imageUrl && onViewSlip(order.slip.imageUrl)}
          className="w-24 h-32 sm:w-32 sm:h-44 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.slip.imageUrl} alt="slip" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded-lg transition-opacity">
              ดูรูป
            </span>
          </div>
        </button>

        {/* Info + actions */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-xs text-gray-400 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
              <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
            </div>
            <p className="font-bold text-gray-900 truncate">{order.customer.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{order.customer.phone}</p>
            <div className="mt-2 bg-gray-50 rounded-xl p-2 text-xs text-gray-600">
              {order.items.map((i) => (
                <div key={i.productId}>{i.name} × {i.quantity}</div>
              ))}
            </div>
            <p className="font-black text-[#85241F] text-lg mt-2">{money(order.total)}</p>
          </div>

          {/* Approve / Reject */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onApprove(order.id, true)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> อนุมัติ
            </button>
            <button
              onClick={() => onApprove(order.id, false)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              <XCircle className="w-4 h-4" /> ปฏิเสธ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Order Row ──────────────────────────────────────────────────────────── */

function OrderRow({ order, onStatusChange }: {
  order: Order;
  onStatusChange: (id: string, s: OrderStatus) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full shrink-0 ${
          ["paid", "completed"].includes(order.status) ? "bg-emerald-500" :
          order.status === "cancelled" ? "bg-red-500" :
          order.status === "payment_review" ? "bg-orange-500" :
          order.status === "pending_payment" ? "bg-amber-400" : "bg-blue-400"
        }`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-900">{order.customer.name}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[order.status]}`}>
              {STATUS_LABEL[order.status]}
            </span>
            {order.slip.status === "pending" && (
              <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                รอตรวจสลิป
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-bold text-sm text-gray-900">{money(order.total)}</p>
          <p className="text-[10px] text-gray-400">{timeAgo(order.createdAt)}</p>
        </div>

        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 p-3 flex flex-col gap-3">
          {/* Customer info */}
          <div className="bg-gray-50 rounded-xl p-3 text-sm">
            <p className="text-xs text-gray-400 mb-1">ที่อยู่จัดส่ง</p>
            <p className="text-gray-700">{order.customer.address}</p>
            <p className="text-gray-500 text-xs mt-1">{order.customer.phone}</p>
          </div>

          {/* Slip thumbnail if exists */}
          {order.slip.imageUrl && order.slip.status !== "pending" && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={order.slip.imageUrl} alt="slip" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs text-gray-400">สลิป</p>
                <Badge variant={order.slip.status === "approved" ? "success" : "destructive"}>
                  {order.slip.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว"}
                </Badge>
              </div>
            </div>
          )}

          {/* Status changer */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">เปลี่ยน status</p>
            <div className="flex flex-wrap gap-1.5">
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(order.id, s)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    order.status === s
                      ? "bg-[#85241F] text-white border-[#85241F]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#85241F]/30"
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Add Product Form ───────────────────────────────────────────────────── */

function AddProductForm({ onSubmit, notify }: {
  onSubmit: (fd: FormData) => void;
  notify: (msg: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState("");
  const [imageMode, setImageMode] = React.useState<"upload" | "url">("upload");
  const fileRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (imageMode === "upload" && imagePreview) fd.set("imageUrl", imagePreview);
    onSubmit(fd);
    formRef.current?.reset();
    setImagePreview("");
    setOpen(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-[#85241F]" />
          <span className="font-semibold text-gray-900">เพิ่มสินค้าใหม่</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4">
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Image toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              {(["upload", "url"] as const).map((m) => (
                <button key={m} type="button" onClick={() => { setImageMode(m); setImagePreview(""); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${imageMode === m ? "bg-white text-[#85241F] shadow-sm" : "text-gray-500"}`}>
                  {m === "upload" ? "📁 อัพโหลด" : "🔗 URL"}
                </button>
              ))}
            </div>

            {imageMode === "upload" ? (
              <>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                {imagePreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="preview" className="w-full h-36 object-cover rounded-xl border border-gray-200" />
                    <button type="button" onClick={() => setImagePreview("")}
                      className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center gap-1.5 hover:border-[#85241F]/30 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">แตะเพื่ออัพโหลด</span>
                  </button>
                )}
              </>
            ) : (
              <Input name="imageUrl" placeholder="https://..." value={imagePreview}
                onChange={(e) => setImagePreview(e.target.value)}
                className="rounded-xl border-gray-200" />
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs mb-1 block">ชื่อสินค้า *</Label>
                <Input name="name" required className="rounded-xl border-gray-200" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">ราคา (฿)</Label>
                <Input name="price" type="number" min="0" className="rounded-xl border-gray-200" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">สต็อก</Label>
                <Input name="stock" type="number" min="0" className="rounded-xl border-gray-200" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-1 block">ส่วนลด (%)</Label>
                <div className="relative">
                  <Input name="discount" type="number" min="0" max="100" placeholder="0"
                    className="rounded-xl border-gray-200 pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-1 block">คำอธิบาย</Label>
                <Textarea name="description" rows={2} className="rounded-xl border-gray-200 resize-none" />
              </div>
            </div>

            <Button type="submit" className="bg-[#85241F] hover:bg-[#B72D2A] rounded-xl h-11 w-full">
              <PackagePlus className="w-4 h-4" /> เพิ่มสินค้า
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ─── Product Card ───────────────────────────────────────────────────────── */

function ProductCard({ product, onUpdate, onDelete }: {
  product: Product;
  onUpdate: (p: Product) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({ ...product });
  const [imagePreview, setImagePreview] = React.useState(product.imageUrl ?? "");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const discountedPrice = form.discount ? Math.round(form.price * (1 - form.discount / 100)) : null;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setForm((f) => ({ ...f, imageUrl: result }));
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    onUpdate({ ...form, imageUrl: imagePreview || undefined });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="bg-white rounded-2xl border border-[#85241F]/30 overflow-hidden shadow-sm col-span-2 sm:col-span-1">
        {/* Image preview */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {imagePreview
            ? <img src={imagePreview} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-300" /></div>}
          <button type="button" onClick={() => fileRef.current?.click()}
            className="absolute bottom-2 right-2 bg-white rounded-full px-2.5 py-1 text-xs font-medium shadow flex items-center gap-1">
            <Upload className="w-3 h-3" /> เปลี่ยนรูป
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>

        <div className="p-3 flex flex-col gap-2">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="ชื่อสินค้า" className="rounded-xl border-gray-200 text-sm h-9" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-gray-400">ราคา (฿)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="rounded-xl border-gray-200 text-sm h-9" />
            </div>
            <div>
              <Label className="text-[10px] text-gray-400">สต็อก</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
                className="rounded-xl border-gray-200 text-sm h-9" />
            </div>
          </div>
          <div>
            <Label className="text-[10px] text-gray-400">ส่วนลด (%)</Label>
            <div className="relative">
              <Input type="number" min="0" max="100" value={form.discount ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="0" className="rounded-xl border-gray-200 text-sm h-9 pr-7" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
            </div>
            {form.discount ? (
              <p className="text-xs text-emerald-600 mt-1">
                ราคาหลังลด: <span className="font-bold">{money(Math.round(form.price * (1 - form.discount / 100)))}</span>
              </p>
            ) : null}
          </div>
          <div className="flex gap-2 mt-1">
            <Button onClick={handleSave} className="flex-1 bg-[#85241F] hover:bg-[#B72D2A] rounded-xl h-9 text-xs">
              บันทึก
            </Button>
            <Button onClick={() => setEditing(false)} variant="outline" className="flex-1 rounded-xl h-9 text-xs">
              ยกเลิก
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {imagePreview
          ? <img src={imagePreview} alt={product.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-300" /></div>}
        {product.discount ? (
          <span className="absolute top-2 left-2 bg-[#85241F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
            -{product.discount}%
          </span>
        ) : null}
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={() => setEditing(true)}
            className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50">
            <Pencil className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button onClick={() => { if (confirm("ลบสินค้านี้?")) onDelete(product.id); }}
            className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm truncate">{product.name}</p>
        <div className="flex items-center justify-between mt-1">
          <div>
            {discountedPrice ? (
              <div>
                <span className="font-black text-[#85241F] text-sm">{money(discountedPrice)}</span>
                <span className="text-[10px] text-gray-400 line-through ml-1">{money(product.price)}</span>
              </div>
            ) : (
              <span className="font-black text-[#85241F] text-sm">{money(product.price)}</span>
            )}
          </div>
          <span className="text-xs text-gray-400">{product.stock} ชิ้น</span>
        </div>
      </div>
    </div>
  );
}
