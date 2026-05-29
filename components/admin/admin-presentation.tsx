"use client";

import * as React from "react";
import {
  BarChart3,
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
  TrendingUp,
  Truck,
  Globe,
  Search,
  Filter,
  DollarSign,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  FileCheck2,
  PackageX,
  Tags,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/language-context";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type OrderStatus =
  | "pending_payment" | "payment_review" | "paid"
  | "packing" | "shipped" | "completed" | "cancelled";

type SlipStatus = "none" | "pending" | "approved" | "rejected";

type Product = {
  id: string; name: string; slug: string;
  description?: string; price: number; stock: number;
  category?: string;
  options?: ProductOption[];
  imageUrl?: string; active: boolean;
};

type ProductOption = {
  label: string;
  imageUrl?: string;
};

type Order = {
  id: string;
  customer: { name: string; phone: string; address: string };
  items: { productId: string; name: string; price: number; quantity: number; subtotal: number }[];
  total: number;
  status: OrderStatus;
  slip: { imageUrl?: string; amount?: number; status: SlipStatus };
  trackingNumber?: string;
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
    status: "payment_review",
    slip: { imageUrl: "https://picsum.photos/seed/slip3/400/600", amount: 550, status: "pending" },
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
  "paid", "packing", "shipped", "completed",
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function money(v: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(v);
}

function timeAgo(iso: string, lang: "th" | "en") {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return lang === "th" ? "เมื่อกี้" : "just now";
  if (m < 60) return lang === "th" ? `${m} นาทีที่แล้ว` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === "th" ? `${h} ชั่วโมงที่แล้ว` : `${h}h ago`;
  return lang === "th" ? `${Math.floor(h / 24)} วันที่แล้ว` : `${Math.floor(h / 24)}d ago`;
}

function isPickupOrder(order: Order) {
  return /รับเอง|pickup|self pickup|D1/i.test(order.customer.address);
}

function parseProductOptions(value: string): ProductOption[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [label = "", imageUrl = ""] = item.split("|").map((part) => part.trim());
      return { label, imageUrl };
    })
    .filter((option) => option.label);
}

function productOptionsText(options?: ProductOption[]) {
  return (options ?? [])
    .map((option) => `${option.label}${option.imageUrl ? ` | ${option.imageUrl}` : ""}`)
    .join("\n");
}

function productOptionLabels(options?: ProductOption[]) {
  return (options ?? []).map((option) => option.label).join(" / ");
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-50 text-amber-700 border-amber-200/60",
  payment_review: "bg-orange-50 text-orange-700 border-orange-200/60",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  packing: "bg-blue-50 text-blue-700 border-blue-200/60",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
  completed: "bg-green-50 text-green-700 border-green-200/60",
  cancelled: "bg-red-50 text-red-700 border-red-200/60",
};

/* ─── Main ────────────────────────────────────────────────────────────────── */

async function api<T>(path: string, init?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    const payload = await response.json();
    if (!response.ok) {
      return { error: payload.error || "Request failed" };
    }
    return payload;
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export function AdminPresentation() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [productSearch, setProductSearch] = React.useState("");
  const [productCategory, setProductCategory] = React.useState("all");
  const [shippingFilter, setShippingFilter] = React.useState<"all" | "delivery" | "pickup">("all");
  const [toast, setToast] = React.useState("");
  const [confirm, setConfirm] = React.useState<{ orderId: string; approved: boolean } | null>(null);
  const [statusConfirm, setStatusConfirm] = React.useState<{ orderId: string; status: OrderStatus } | null>(null);
  const [lightbox, setLightbox] = React.useState<string | null>(null);
  const { lang, setLang, t } = useLanguage();

  const [loading, setLoading] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [loginError, setLoginError] = React.useState("");

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  // Persistence check for admin login
  React.useEffect(() => {
    const adminSession = sessionStorage.getItem("admin-logged-in");
    if (adminSession === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    const [ordersRes, productsRes] = await Promise.all([
      api<Order[]>("/api/backend/admin/orders"),
      api<Product[]>("/api/backend/admin/products"),
    ]);
    
    // Use Mock Data as an intelligent local fallback in case database collections are entirely empty during setup
    if (ordersRes.data) {
      setOrders(ordersRes.data.length > 0 ? ordersRes.data : MOCK_ORDERS);
    } else {
      setOrders(MOCK_ORDERS);
    }

    if (productsRes.data) {
      setProducts(productsRes.data);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn, loadData]);

  const pendingSlips = orders.filter((o) => o.slip.status === "pending");

  // Advanced search and shipping filter implementation
  const filteredOrders = orders.filter((o) => {
    const displayStatus = o.status === "payment_review" ? "paid" : o.status;
    const matchStatus = statusFilter === "all" || displayStatus === statusFilter;

    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.phone.includes(q) ||
      o.id.toLowerCase().includes(q);

    const isPickup = isPickupOrder(o);
    const matchShipping =
      shippingFilter === "all" ||
      (shippingFilter === "pickup" && isPickup) ||
      (shippingFilter === "delivery" && !isPickup);

    return matchStatus && matchSearch && matchShipping;
  });

  function approveSlip(orderId: string, approved: boolean) {
    setConfirm({ orderId, approved });
  }

  async function confirmApprove() {
    if (!confirm) return;
    setLoading(true);
    const res = await api<Order>(`/api/backend/admin/slips/${confirm.orderId}`, {
      method: "POST",
      body: JSON.stringify({ approved: confirm.approved, reviewedBy: "admin" }),
    });
    setLoading(false);
    if (res.error) {
      notify(res.error);
    } else {
      notify(confirm.approved ? t("admin.toast.slip_approved") : t("admin.toast.slip_rejected"));
      if (res.data) {
        setOrders((current) =>
          current.map((order) => (order.id === res.data?.id ? res.data : order)),
        );
      }
      loadData();
    }
    setConfirm(null);
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    setLoading(true);
    const res = await api<Order>(`/api/backend/admin/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    if (res.error) {
      notify(res.error);
    } else {
      notify(t("admin.toast.product_updated"));
      loadData();
    }
  }

  async function saveTrackingNumber(orderId: string, trackingNumber: string) {
    setLoading(true);
    const res = await api<Order>(`/api/backend/admin/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ trackingNumber }),
    });
    setLoading(false);
    if (res.error) {
      notify(res.error);
    } else {
      notify(lang === "th" ? "บันทึกเลขพัสดุแล้ว" : "Tracking number saved");
      if (res.data) {
        setOrders((current) =>
          current.map((order) => (order.id === res.data?.id ? res.data : order)),
        );
      }
      loadData();
    }
  }

  function triggerStatusConfirm(orderId: string, status: OrderStatus) {
    setStatusConfirm({ orderId, status });
  }

  function confirmStatusChange() {
    if (!statusConfirm) return;
    updateStatus(statusConfirm.orderId, statusConfirm.status);
    setStatusConfirm(null);
  }

  async function addProduct(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    setLoading(true);
    const res = await api<Product>("/api/backend/admin/products", {
      method: "POST",
      body: JSON.stringify({
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description: String(formData.get("description") ?? "").trim() || undefined,
        price: Number(formData.get("price")) || 0,
        stock: Number(formData.get("stock")) || 0,
        category: String(formData.get("category") ?? "").trim() || undefined,
        options: parseProductOptions(String(formData.get("options") ?? "")),
        imageUrl: String(formData.get("imageUrl") ?? "").trim() || undefined,
        active: true,
      }),
    });
    setLoading(false);
    if (res.error) {
      notify(res.error);
    } else {
      notify(t("admin.toast.product_added"));
      loadData();
    }
  }

  async function updateProduct(updated: Product) {
    setLoading(true);
    const res = await api<Product>(`/api/backend/admin/products/${updated.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: updated.name,
        description: updated.description,
        price: updated.price,
        stock: updated.stock,
        category: updated.category,
        options: updated.options,
        imageUrl: updated.imageUrl,
        active: updated.active,
      }),
    });
    setLoading(false);
    if (res.error) {
      notify(res.error);
    } else {
      notify(t("admin.toast.product_updated"));
      loadData();
    }
  }

  async function deleteProduct(id: string) {
    setLoading(true);
    const res = await api<{ success: boolean }>(`/api/backend/admin/products/${id}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (res.error) {
      notify(res.error);
    } else {
      notify(t("admin.toast.product_deleted"));
      loadData();
    }
  }

  // Stats dashboard data aggregates
  const statsRevenue = orders.reduce((sum, o) => ["paid", "packing", "shipped", "completed"].includes(o.status) ? sum + o.total : sum, 0);
  const statsPending = pendingSlips.length;
  const statsActive = orders.filter(o => ["packing", "shipped"].includes(o.status)).length;
  const statsTotal = orders.length;
  const statusOverview = ORDER_STATUSES.map((status) => ({
    status,
    count: orders.filter((order) => {
      const displayStatus = order.status === "payment_review" ? "paid" : order.status;
      return displayStatus === status;
    }).length,
  })).filter((item) => item.count > 0);
  const productCategories = React.useMemo(() => {
    const values = products
      .map((product) => product.category?.trim())
      .filter((value): value is string => Boolean(value));

    return Array.from(new Set(values));
  }, [products]);
  const filteredProducts = React.useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    return products.filter((product) => {
      const matchSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query);
      const matchCategory =
        productCategory === "all" || (product.category || "uncategorized") === productCategory;

      return matchSearch && matchCategory;
    });
  }, [products, productCategory, productSearch]);
  const productStats = {
    total: products.length,
    outOfStock: products.filter((product) => product.stock <= 0).length,
    withOptions: products.filter((product) => product.options?.length).length,
  };

  if (!isLoggedIn) {
    return (
      <main 
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans"
        style={{ background: "radial-gradient(circle, #5c1613 0%, #240a08 50%, #0d0303 100%)" }}
      >
        {/* Floating background glowing orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-red-900/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-900/10 blur-[120px] pointer-events-none" />
        
        {/* Card Container with glassmorphism */}
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl flex flex-col gap-6 relative z-10 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Floating Language Switcher */}
          <div className="absolute top-6 right-6 flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl shadow-inner">
            <Globe className="w-3.5 h-3.5 text-white/50 ml-1.5 shrink-0" />
            <button
              onClick={() => setLang("th")}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition-all cursor-pointer ${
                lang === "th"
                  ? "bg-[#85241F] text-white shadow-md shadow-[#85241F]/30"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              TH
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition-all cursor-pointer ${
                lang === "en"
                  ? "bg-[#85241F] text-white shadow-md shadow-[#85241F]/30"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              EN
            </button>
          </div>

          <div className="flex flex-col items-center text-center mt-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#85241F] to-[#b8332b] flex items-center justify-center shadow-lg shadow-[#85241F]/35 mb-4 animate-pulse">
              <Package className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none block">{t("admin.login.title")}</h1>
            <p className="text-[10px] text-white/55 mt-2 leading-relaxed max-w-xs block">{t("admin.login.subtitle")}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const username = String(fd.get("username")).trim();
              const password = String(fd.get("password")).trim();
              
              if (username === "admin" && password === "password") {
                sessionStorage.setItem("admin-logged-in", "true");
                setIsLoggedIn(true);
              } else {
                setLoginError(t("admin.login.error"));
                setTimeout(() => setLoginError(""), 3000);
              }
            }}
            className="flex flex-col gap-4 mt-2"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-white/50 font-bold uppercase tracking-wider pl-1">{t("admin.login.username")}</label>
              <input
                name="username"
                type="text"
                required
                defaultValue="admin"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#85241F] focus:ring-1 focus:ring-[#85241F] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-white/50 font-bold uppercase tracking-wider pl-1">{t("admin.login.password")}</label>
              <input
                name="password"
                type="password"
                required
                defaultValue="password"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#85241F] focus:ring-1 focus:ring-[#85241F] transition-all"
              />
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold py-2.5 px-3 rounded-2xl text-center">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#85241F] to-[#b8332b] hover:opacity-95 text-white font-black py-3.5 px-4 rounded-2xl text-xs shadow-lg shadow-[#85241F]/20 active:scale-98 transition-all cursor-pointer mt-2"
            >
              {t("admin.login.button")}
            </button>
          </form>

          <div className="text-center text-[9px] text-white/35 border-t border-white/5 pt-4 mt-2">
            {t("admin.login.desc")}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <div className="text-center">
              <div className="text-4xl mb-3">{confirm.approved ? "✅" : "❌"}</div>
              <h3 className="font-bold text-lg text-gray-900">
                {confirm.approved ? t("admin.modal.approve_title") : t("admin.modal.reject_title")}
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {confirm.approved ? t("admin.modal.approve_desc") : t("admin.modal.reject_desc")}
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                {t("admin.modal.cancel")}
              </button>
              <button onClick={confirmApprove}
                className={`flex-1 py-3 rounded-2xl text-xs font-bold text-white cursor-pointer transition-all shadow-md active:scale-98 ${confirm.approved ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-red-500 hover:bg-red-600 shadow-red-500/20"}`}>
                {confirm.approved ? t("admin.slip.approve") : t("admin.slip.reject")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {statusConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <div className="text-center flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${statusConfirm.status === "cancelled" ? "bg-red-50 text-red-500 border border-red-100" : "bg-emerald-50 text-emerald-500 border border-emerald-100"
                }`}>
                {statusConfirm.status === "cancelled" ? <XCircle className="w-6 h-6 animate-pulse" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <h3 className="font-extrabold text-gray-900 text-sm">
                {statusConfirm.status === "cancelled"
                  ? t("admin.modal.cancel_title")
                  : t("admin.modal.status_title")}
              </h3>
              <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                {statusConfirm.status === "cancelled"
                  ? t("admin.modal.cancel_desc")
                  : t("admin.modal.status_desc", { status: t(`admin.status.${statusConfirm.status}`) })}
              </p>
            </div>
            <div className="flex gap-3 mt-2.5">
              <button onClick={() => setStatusConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                {t("admin.modal.cancel")}
              </button>
              <button onClick={confirmStatusChange}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all shadow-md active:scale-98 ${statusConfirm.status === "cancelled"
                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                    : "bg-[#85241F] hover:bg-[#B72D2A] shadow-[#85241F]/20"
                  }`}>
                {t("admin.modal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="slip" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl border border-white/10" />
        </div>
      )}

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl border border-white/10 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-4.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#85241F] flex items-center justify-center shrink-0 shadow-lg shadow-[#85241F]/20">
              <Package className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="font-black text-gray-900 tracking-tight text-base leading-none block">{t("admin.header")}</span>
              <span className="text-[10px] text-gray-400 mt-1 block">
                {t("admin.stats_summary", { orders: orders.length, products: products.length })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingSlips.length > 0 && (
              <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 text-[10px] font-bold px-2.5 py-1.5 rounded-full border border-orange-100">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                {t("admin.pending_badge", { count: pendingSlips.length })}
              </span>
            )}

            {/* Header Language Switcher */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200/50 p-1 rounded-xl shadow-xs">
              <Globe className="w-3.5 h-3.5 text-gray-400 ml-1.5 shrink-0" />
              <button
                onClick={() => setLang("th")}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition-all cursor-pointer ${lang === "th"
                    ? "bg-[#85241F] text-white shadow-xs"
                    : "text-gray-400 hover:text-gray-700"
                  }`}
              >
                TH
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition-all cursor-pointer ${lang === "en"
                    ? "bg-[#85241F] text-white shadow-xs"
                    : "text-gray-400 hover:text-gray-700"
                  }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        <Tabs defaultValue="orders">
          <TabsList className="w-full grid grid-cols-2 bg-white border border-slate-100 rounded-2xl p-1.5 h-auto shadow-xs">
            <TabsTrigger value="orders" className="h-11 rounded-xl data-[state=active]:bg-[#85241F] data-[state=active]:text-white font-bold text-xs gap-2 transition-all cursor-pointer">
              <ClipboardList className="w-4 h-4" />
              {t("admin.tab.orders")}
              {pendingSlips.length > 0 && (
                <span className="bg-orange-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                  {pendingSlips.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="products" className="h-11 rounded-xl data-[state=active]:bg-[#85241F] data-[state=active]:text-white font-bold text-xs gap-2 transition-all cursor-pointer">
              <Package className="w-4 h-4" />
              {t("admin.tab.products")}
            </TabsTrigger>
          </TabsList>

          {/* ── Orders Tab ── */}
          <TabsContent value="orders" className="mt-5 flex flex-col gap-6 animate-in fade-in duration-200">

            {/* Redesigned Executive Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-white border border-emerald-100/80 rounded-2xl p-4.5 shadow-xs flex items-center gap-3.5 hover:shadow-md hover:border-emerald-200 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 transition-transform group-hover:scale-105">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t("admin.stats.revenue")}</span>
                  <span className="text-base font-black text-gray-900 block mt-0.5 tracking-tight truncate">{money(statsRevenue)}</span>
                </div>
              </div>

              <div className={`bg-white border rounded-2xl p-4.5 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-all group relative overflow-hidden ${statsPending > 0 ? "border-orange-200 ring-2 ring-orange-500/5" : "border-gray-100 hover:border-orange-200"}`}>
                {statsPending > 0 && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${statsPending > 0 ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-gray-50 text-gray-500 border-gray-100"}`}>
                  <FileCheck2 className="w-5 h-5 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t("admin.stats.pending")}</span>
                  <span className={`text-base font-black block mt-0.5 tracking-tight truncate ${statsPending > 0 ? "text-orange-600" : "text-gray-900"}`}>{statsPending}</span>
                </div>
              </div>

              <div className="bg-white border border-blue-100/80 rounded-2xl p-4.5 shadow-xs flex items-center gap-3.5 hover:shadow-md hover:border-blue-200 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 transition-transform group-hover:scale-105">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t("admin.stats.active")}</span>
                  <span className="text-base font-black text-gray-900 block mt-0.5 tracking-tight truncate">{statsActive}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-100/80 rounded-2xl p-4.5 shadow-xs flex items-center gap-3.5 hover:shadow-md hover:border-slate-200 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-100 transition-transform group-hover:scale-105">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t("admin.stats.completed")}</span>
                  <span className="text-base font-black text-gray-900 block mt-0.5 tracking-tight truncate">{statsTotal}</span>
                </div>
              </div>
            </div>


            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black text-gray-900">
                  {lang === "th" ? "สรุปสถานะคำสั่งซื้อ" : "Order Status Overview"}
                </span>
                <BarChart3 className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
                {statusOverview.length > 0 ? (
                  statusOverview.map((item) => (
                    <button
                      key={item.status}
                      type="button"
                      onClick={() => setStatusFilter(item.status)}
                      className={`${STATUS_COLOR[item.status].split(" ")[0]} transition-opacity hover:opacity-80`}
                      style={{ width: `${Math.max(6, (item.count / Math.max(1, statsTotal)) * 100)}%` }}
                      aria-label={t(`admin.status.${item.status}`)}
                    />
                  ))
                ) : (
                  <div className="h-full w-full bg-gray-200" />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ORDER_STATUSES.map((status) => {
                  const count = statusOverview.find((item) => item.status === status)?.count ?? 0;

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors ${
                        statusFilter === status
                          ? "border-[#85241F] bg-[#85241F] text-white"
                          : "border-gray-200 bg-white text-gray-500 hover:border-[#85241F]/30"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${STATUS_COLOR[status].split(" ")[0]}`} />
                      {t(`admin.status.${status}`)}
                      <span className="font-black">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zone 2: All orders */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                <h2 className="font-bold text-gray-900 text-sm">{t("admin.orders.all")}</h2>

                {/* Advanced Search & Filtering Controls */}
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  {/* Shipping mode toggle */}
                  <div className="flex bg-white border border-gray-200/70 p-0.5 rounded-xl shadow-2xs shrink-0 self-start sm:self-auto">
                    {([
                      { key: "all", labelKey: "admin.orders.filter_all" },
                      { key: "delivery", labelKey: "admin.orders.filter_delivery" },
                      { key: "pickup", labelKey: "admin.orders.filter_pickup" }
                    ] as const).map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setShippingFilter(opt.key)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${shippingFilter === opt.key
                            ? "bg-slate-900 text-white shadow-xs"
                            : "text-gray-500 hover:text-gray-900"
                          }`}
                      >
                        {t(opt.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advanced Search Input Bar */}
              <div className="bg-white border border-gray-200/60 rounded-2xl px-4.5 py-3 shadow-2xs mb-4.5 flex items-center gap-3 focus-within:border-[#85241F] focus-within:ring-2 focus-within:ring-[#85241F]/5 transition-all">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("admin.orders.search_placeholder")}
                  className="flex-1 bg-transparent border-none text-xs outline-none text-gray-800 placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status filter chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-3.5 border-b border-gray-100">
                {(["all", ...ORDER_STATUSES] as const).map((s) => {
                  const count = s === "all"
                    ? orders.length
                    : orders.filter((o) => {
                      const displayStatus = o.status === "payment_review" ? "paid" : o.status;
                      return displayStatus === s;
                    }).length;
                  if (count === 0 && s !== "all") return null;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`shrink-0 h-8 px-3 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${statusFilter === s
                          ? "bg-[#85241F] text-white border-[#85241F] shadow-sm shadow-[#85241F]/10"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#85241F]/30 hover:bg-gray-50"
                        }`}
                    >
                      {s === "all" ? t("admin.orders.filter_all") : t(`admin.status.${s as OrderStatus}`)} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3">
                {filteredOrders.map((order) => (
                  <OrderRow key={order.id} order={order} onStatusChange={triggerStatusConfirm} onSaveTracking={saveTrackingNumber} onApproveSlip={approveSlip} t={t} onViewSlip={setLightbox} />
                ))}
                {filteredOrders.length === 0 && (
                  <div className="bg-white border border-gray-100 rounded-3xl py-12 flex flex-col items-center justify-center text-center shadow-2xs">
                    <AlertCircle className="w-8 h-8 text-gray-300 animate-pulse mb-2" />
                    <p className="text-xs text-gray-400 font-semibold">{t("admin.orders.empty")}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Products Tab ── */}
          <TabsContent value="products" className="mt-4 flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-3 gap-3">
              <ProductStatCard icon={<Package className="h-4 w-4" />} label={lang === "th" ? "สินค้าทั้งหมด" : "Products"} value={productStats.total} tone="slate" />
              <ProductStatCard icon={<PackageX className="h-4 w-4" />} label={lang === "th" ? "สินค้าหมด" : "Out of stock"} value={productStats.outOfStock} tone="red" />
              <ProductStatCard icon={<Tags className="h-4 w-4" />} label={lang === "th" ? "มีตัวเลือก" : "Options"} value={productStats.withOptions} tone="emerald" />
            </div>

            <AddProductForm onSubmit={addProduct} notify={notify} t={t} />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">{t("admin.tab.products")}</h2>
              </div>
              <div className="mb-3 flex items-center gap-3 rounded-2xl border border-gray-200/60 bg-white px-4 py-3 shadow-2xs transition-all focus-within:border-[#85241F] focus-within:ring-2 focus-within:ring-[#85241F]/5">
                <Search className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder={lang === "th" ? "ค้นหาสินค้าหลังบ้าน..." : "Search products..."}
                  className="flex-1 border-none bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
                />
                {productSearch ? (
                  <button onClick={() => setProductSearch("")} className="text-gray-400 hover:text-gray-600">
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {["all", ...productCategories].map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setProductCategory(category)}
                    className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-all ${
                      productCategory === category
                        ? "border-[#85241F] bg-[#85241F] text-white shadow-sm shadow-[#85241F]/10"
                        : "border-gray-200 bg-white text-gray-600 hover:border-[#85241F]/30 hover:bg-gray-50"
                    }`}
                  >
                    <Tags className="h-3 w-3" />
                    {category === "all" ? t("admin.orders.filter_all") : category}
                  </button>
                ))}
              </div>
            </div>

            {filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} onUpdate={updateProduct} onDelete={deleteProduct} t={t} />
                ))}
              </div>
            )}
            {filteredProducts.length === 0 && (
              <div className="bg-white border border-gray-100 rounded-3xl py-12 flex flex-col items-center justify-center text-center shadow-2xs">
                <Package className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-xs text-gray-400 font-semibold">{t("admin.products.empty")}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}



/* ─── Order Row with Stepper timeline & mock parcel ────────────────────────── */

function ProductStatCard({ icon, label, value, tone }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "slate" | "red" | "emerald";
}) {
  const borderClass = {
    slate: "border-slate-100",
    red: "border-red-100",
    emerald: "border-emerald-100",
  }[tone];
  const iconClass = {
    slate: "bg-slate-50 text-slate-700",
    red: "bg-red-50 text-red-600",
    emerald: "bg-emerald-50 text-emerald-600",
  }[tone];
  const valueClass = {
    slate: "text-gray-900",
    red: "text-red-600",
    emerald: "text-emerald-600",
  }[tone];

  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-xs ${borderClass}`}>
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase text-gray-400">{label}</p>
      <p className={`mt-1 text-lg font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function OrderRow({ order, onStatusChange, onSaveTracking, onApproveSlip, t, onViewSlip }: {
  order: Order;
  onStatusChange: (id: string, s: OrderStatus) => void;
  onSaveTracking: (id: string, trackingNumber: string) => void;
  onApproveSlip: (orderId: string, approved: boolean) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  onViewSlip: (url: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [trackingNumber, setTrackingNumber] = React.useState(order.trackingNumber ?? "");
  const { lang } = useLanguage();

  React.useEffect(() => {
    setTrackingNumber(order.trackingNumber ?? "");
  }, [order.trackingNumber]);

  const isPickup = isPickupOrder(order);
  const canEditTracking = ["shipped", "completed"].includes(order.status) && !isPickup;

  const logisticsSteps = [
    { label: lang === "th" ? "รอตรวจสลิป" : "Reviewing slip" },
    { label: lang === "th" ? "จัดส่งแล้ว" : "Shipped" },
    { label: lang === "th" ? "สำเร็จ" : "Complete" },
  ];
  const transitionSteps: OrderStatus[] = [
    "paid",
    "packing",
    "shipped",
    "completed",
  ];

  const logisticsIdx =
    order.status === "completed"
      ? 2
      : ["paid", "packing", "shipped"].includes(order.status)
        ? 1
        : 0;
  const timelineSteps = transitionSteps;
  const stepperStatus = order.status === "payment_review" ? "paid" : order.status;
  const currentIdx = timelineSteps.indexOf(stepperStatus);

  return (
    <div className={`bg-white rounded-3xl border shadow-2xs overflow-hidden transition-all duration-200 ${open ? "border-slate-200/80 ring-3 ring-slate-100" : "border-slate-100 hover:border-slate-200"
      }`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        {/* Status dot */}
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${order.status === "completed" ? "bg-green-500" :
            order.status === "paid" ? "bg-emerald-500 animate-pulse" :
              order.status === "payment_review" ? "bg-orange-500 animate-bounce" :
                "bg-blue-400"
          }`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-xs text-gray-900 leading-none">{order.customer.name}</span>
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${STATUS_COLOR[order.status]}`}>
              {t(`admin.status.${order.status}`)}
            </span>
            {order.slip.status === "pending" && (
              <span className="text-[8px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md border border-orange-200 animate-pulse">
                {t("admin.status.payment_review")}
              </span>
            )}
            <span className="text-[9px] text-gray-300 font-bold font-mono">
              #{order.id.slice(-6).toUpperCase()}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-semibold truncate">
            {order.items.map((i) => {
              const trName = t(`product.${i.productId}.name`);
              const name = trName === `product.${i.productId}.name` ? i.name : trName;
              return `${name} ×${i.quantity}`;
            }).join(", ")}
          </p>
        </div>

        <div className="text-right shrink-0 mr-1">
          <p className="font-black text-xs text-gray-950">{money(order.total)}</p>
          <p className="text-[9px] text-gray-400 font-bold mt-1">{timeAgo(order.createdAt, lang)}</p>
        </div>

        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4.5 bg-slate-50/20 flex flex-col gap-5 animate-in slide-in-from-top-2 duration-200">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-3xs">
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[9px] font-bold uppercase text-gray-400">
                  {lang === "th" ? "ชื่อคนสั่ง" : "Customer"}
                </p>
                <p className="mt-1 text-sm font-black text-gray-900">{order.customer.name}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase text-gray-400">
                  {lang === "th" ? "เบอร์โทร" : "Phone"}
                </p>
                <p className="mt-1 text-sm font-black text-gray-900">{order.customer.phone}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase text-gray-400">
                  {lang === "th" ? "ของที่สั่ง" : "Items"}
                </p>
                <p className="text-sm font-black text-[#85241F]">{money(order.total)}</p>
              </div>
              <div className="space-y-1.5">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.productId}`} className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate font-semibold text-gray-700">{item.name}</span>
                    <span className="shrink-0 font-black text-gray-500">
                      x{item.quantity} · {money(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Redesigned Premium Logistics Stepper */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs">
            <p className="mb-4 text-[10px] font-black text-slate-800">
              {lang === "th" ? "การจัดส่ง (LOGISTICS)" : "LOGISTICS"}
            </p>
            <div className="flex items-start justify-between relative px-2">
              <div className="absolute top-3 left-6 right-6 h-0.5 bg-gray-100 z-0" />
              <div
                className="absolute top-3 left-6 h-0.5 bg-[#96231F] z-0 transition-all duration-500"
                style={{ width: logisticsIdx === 0 ? "0%" : logisticsIdx === 1 ? "50%" : "calc(100% - 3rem)" }}
              />
              {logisticsSteps.map((stepItem, idx) => {
                const active = idx <= logisticsIdx;

                return (
                  <div key={stepItem.label} className="flex flex-col items-center z-10 w-20">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] text-white ${active ? "bg-[#96231F]" : "bg-gray-300"}`}>
                      {idx + 1}
                    </div>
                    <span className={`mt-2 text-[9px] font-black text-center ${active ? "text-slate-800" : "text-gray-400"}`}>
                      {stepItem.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {order.status === "completed" ? (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="flex items-center gap-2 text-sm font-black text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  {t("admin.order.is_completed")}
                </p>
              </div>
            ) : null}
          </div>
          <div className="hidden">
            <div className="flex items-center justify-between relative">
              {/* Connector line */}
              <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-gray-100 z-0" />
              <div
                className="absolute top-3.5 left-6 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
                style={{ width: `${(Math.max(0, currentIdx) / (timelineSteps.length - 1)) * 92}%` }}
              />

              {timelineSteps.map((s, idx) => {
                const done = idx < currentIdx || order.status === "completed";
                const active = idx === currentIdx;

                return (
                  <div key={s} className="flex flex-col items-center z-10">
                    <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-black text-[10px] shadow-sm ${done ? "bg-emerald-500 border-emerald-500 text-white" :
                        active ? "bg-white border-[#85241F] text-[#85241F] scale-110 ring-4 ring-[#85241F]/5" :
                          "bg-white border-gray-200 text-gray-300"
                      }`}>
                      {done ? "✓" : idx + 1}
                    </div>
                    <span className={`text-[8px] font-bold mt-2 text-center max-w-[65px] truncate block ${active ? "text-[#85241F] font-black" : done ? "text-emerald-600" : "text-gray-400"
                      }`}>
                      {t(`admin.status.${s}`)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Redesigned Mock Parcel Label details block */}
            <div className="bg-linear-to-br from-amber-50/20 to-amber-100/10 border-2 border-dashed border-amber-200/80 rounded-2xl p-4 shadow-3xs relative overflow-hidden flex flex-col justify-between">
              {/* Corner Stamp */}
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-[8px] font-black text-amber-600/40 rotate-12 uppercase pointer-events-none select-none">
                HLLC POST
              </div>

              <div>
                <div className="flex items-center justify-between border-b border-amber-200/50 pb-2 mb-3.5">
                  <div className="flex items-center gap-1.5 text-amber-800 text-[10px] font-black">
                    <Truck className="w-3.5 h-3.5" />
                    <span>{isPickup ? t("admin.order.pickup_label") : t("admin.order.shipping_label")}</span>
                  </div>
                  <span className="text-[8px] text-amber-500 font-bold font-mono">CODE: #{order.id.slice(-6).toUpperCase()}</span>
                </div>

                {/* Simulated Barcode */}
                <div className="flex gap-0.5 justify-center py-1 bg-white border border-amber-200/40 rounded-lg mb-3 max-w-[180px] mx-auto select-none opacity-80 pointer-events-none">
                  {[1, 3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 4, 1, 2, 1].map((w, i) => (
                    <div key={i} className="bg-amber-950 h-5" style={{ width: `${w}px` }} />
                  ))}
                </div>

                <div className="text-xs text-gray-700 space-y-2 leading-normal font-semibold">
                  <div>
                    <span className="text-[9px] text-gray-400 block mb-0.5">{isPickup ? t("admin.order.pickup_details") : t("admin.order.address")}</span>
                    <p className="text-gray-800 leading-relaxed pl-1 border-l-2 border-amber-300">{order.customer.address}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pl-1">
                    <span className="text-[9px] text-gray-400 block shrink-0">{t("admin.order.phone")}</span>
                    <span className="text-gray-700 font-mono">{order.customer.phone}</span>
                  </div>
                  {canEditTracking ? (
                    <div className="mt-3 rounded-xl border border-amber-200/60 bg-white/80 p-2.5">
                      <Label className="mb-1.5 block text-[9px] font-black uppercase text-amber-700">
                        {lang === "th" ? "เลขพัสดุ" : "Tracking number"}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={trackingNumber}
                          onChange={(event) => setTrackingNumber(event.target.value)}
                          placeholder={lang === "th" ? "ใส่เลขพัสดุ" : "Enter tracking number"}
                          className="h-9 rounded-lg border-amber-200 bg-white text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => onSaveTracking(order.id, trackingNumber)}
                          className="shrink-0 rounded-lg bg-[#85241F] px-3 text-[10px] font-black text-white transition-colors hover:bg-[#B72D2A]"
                        >
                          {lang === "th" ? "บันทึก" : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Dotted cut line */}
              <div className="border-t border-dashed border-amber-200/60 pt-3 mt-3 flex items-center justify-between text-[8px] font-bold text-amber-600/80">
                <span>THANK YOU FOR SHOPPING!</span>
                <span>D1 DEPOT</span>
              </div>
            </div>

            {/* Slip display / status changer */}
            <div className="flex flex-col gap-4">
              {/* Slip thumbnail if exists and reviewed */}
              {order.slip.imageUrl && order.slip.status !== "pending" && (
                <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-3.5 shadow-3xs">
                  <button
                    onClick={() => order.slip.imageUrl && onViewSlip(order.slip.imageUrl)}
                    className="w-12 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-50 shadow-xs relative group border border-gray-100 cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={order.slip.imageUrl} alt="slip" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                      <span className="opacity-0 group-hover:opacity-100 text-white text-[8px] font-black bg-black/55 px-1.5 py-0.5 rounded-md">
                        {t("admin.slip.view")}
                      </span>
                    </div>
                  </button>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-bold mb-1">{t("admin.order.slip_status")}</p>
                    <Badge variant={order.slip.status === "approved" ? "success" : "destructive"} className="text-[9px] font-black rounded-lg">
                      {order.slip.status === "approved" ? t("admin.order.shipping_label") === "ใบจ่าหน้าพัสดุ" ? "อนุมัติแล้ว" : "Approved" : "ปฏิเสธแล้ว"}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Integrated interactive Slip Approval Card for Pending Slips */}
              {order.slip.imageUrl && order.slip.status === "pending" && (
                <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-4 shadow-3xs flex flex-col gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-orange-200/40 pb-2 mb-1">
                    <span className="text-[10px] text-orange-800 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-orange-600" />
                      {t("admin.status.payment_review")}
                    </span>
                    <span className="text-[9px] text-orange-600 font-mono font-bold">{t("admin.order.slip_status")}</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => order.slip.imageUrl && onViewSlip(order.slip.imageUrl)}
                      className="w-16 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-50 shadow-xs relative group border border-orange-200/50 cursor-pointer"
                    >
                      <img src={order.slip.imageUrl} alt="slip" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                        <span className="opacity-0 group-hover:opacity-100 text-white text-[8px] font-black bg-black/55 px-1.5 py-0.5 rounded-md">
                          {t("admin.slip.view")}
                        </span>
                      </div>
                    </button>
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <span className="text-[9px] text-orange-600 font-bold block">{t("checkout.payment_amount")}</span>
                        <span className="text-sm font-black text-orange-950 block mt-0.5">{money(order.slip.amount || order.total)}</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => onApproveSlip(order.id, true)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-2 px-2.5 rounded-xl text-[10px] shadow-sm active:scale-97 transition-all cursor-pointer text-center"
                        >
                          {t("admin.slip.approve")}
                        </button>
                        <button
                          onClick={() => onApproveSlip(order.id, false)}
                          className="flex-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-extrabold py-2 px-2.5 rounded-xl text-[10px] active:scale-97 transition-all cursor-pointer text-center"
                        >
                          {t("admin.slip.reject")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status changer — Premium linear next-step action layout */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-3xs flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">{t("admin.order.change_status")}</p>

                  {(() => {
                    const stepperStatus = order.status === "payment_review" ? "paid" : order.status;
                    const currentIdx = timelineSteps.indexOf(stepperStatus);
                    const prevStatus = currentIdx > 0 ? timelineSteps[currentIdx - 1] : null;
                    const nextStatus = currentIdx !== -1 && currentIdx < timelineSteps.length - 1 ? timelineSteps[currentIdx + 1] : null;

                    if (order.status === "completed") {
                      return (
                        <div className="flex flex-col gap-3">
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-800 text-xs font-bold shadow-3xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{t("admin.order.is_completed")}</span>
                          </div>
                          {prevStatus && (
                            <button
                              onClick={() => onStatusChange(order.id, prevStatus)}
                              className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-800 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer mt-1"
                            >
                              <span className="text-[11px] font-semibold">⮌</span>
                              <span>{t("admin.order.prev_stage")}</span>
                              <span className="bg-gray-100 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase text-gray-600">
                                {t(`admin.status.${prevStatus}`)}
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col gap-3">
                        {/* Proceed to Next State CTA */}
                        {nextStatus && (
                          <button
                            onClick={() => onStatusChange(order.id, nextStatus)}
                            className="w-full bg-linear-to-r from-[#85241F] to-[#B72D2A] hover:opacity-95 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-[#85241F]/15 active:scale-98 transition-all cursor-pointer"
                          >
                            <span>{t("admin.order.next_stage")}</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase">
                              {t(`admin.status.${nextStatus}`)}
                            </span>
                            <span className="ml-1 text-sm font-light">➔</span>
                          </button>
                        )}

                        {/* Back to Previous State CTA */}
                        {prevStatus && (
                          <button
                            onClick={() => onStatusChange(order.id, prevStatus)}
                            className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-800 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                          >
                            <span className="text-[11px] font-semibold">⮌</span>
                            <span>{t("admin.order.prev_stage")}</span>
                            <span className="bg-gray-100 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase text-gray-600">
                              {t(`admin.status.${prevStatus}`)}
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="border-t border-gray-50 pt-3 mt-3 flex items-center justify-between text-[10px] font-bold text-gray-400">
                  <span>{t("admin.order.item")}</span>
                  <span>{order.items.length} {t("shop.items_count")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Add Product Form ───────────────────────────────────────────────────── */

function AddProductForm({ onSubmit, notify, t }: {
  onSubmit: (fd: FormData) => void;
  notify: (msg: string) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
  const [open, setOpen] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState("");
  const [imageMode, setImageMode] = React.useState<"upload" | "url">("upload");
  const fileRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const { lang } = useLanguage();

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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-[#85241F]" />
          <span className="font-extrabold text-xs text-gray-900">{t("admin.products.add_title")}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4 animate-in slide-in-from-top-2 duration-200">
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Image toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              {(["upload", "url"] as const).map((m) => (
                <button key={m} type="button" onClick={() => { setImageMode(m); setImagePreview(""); }}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${imageMode === m ? "bg-white text-[#85241F] shadow-xs" : "text-gray-500"}`}>
                  {m === "upload" ? t("admin.products.upload") : t("admin.products.url")}
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
                      className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center cursor-pointer">
                      <XCircle className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center gap-1.5 hover:border-[#85241F]/30 transition-colors cursor-pointer">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-400 font-bold">{t("admin.products.upload_tap")}</span>
                  </button>
                )}
              </>
            ) : (
              <Input name="imageUrl" placeholder="https://..." value={imagePreview}
                onChange={(e) => setImagePreview(e.target.value)}
                className="rounded-xl border-gray-200 text-xs" />
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">{t("admin.products.label.name")}</Label>
                <Input name="name" required className="rounded-xl border-gray-200 text-xs h-10" />
              </div>
              <div>
                <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">{t("admin.products.label.price")}</Label>
                <Input name="price" type="number" min="0" required className="rounded-xl border-gray-200 text-xs h-10" />
              </div>
              <div>
                <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">{t("admin.products.label.stock")}</Label>
                <Input name="stock" type="number" min="0" required className="rounded-xl border-gray-200 text-xs h-10" />
              </div>
              <div className="col-span-2">
                <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">
                  {lang === "th" ? "หมวดหมู่สินค้า" : "Product Category"}
                </Label>
                <Input name="category" placeholder="raincoat, umbrella, shoes" className="rounded-xl border-gray-200 text-xs h-10" />
              </div>
              <div className="col-span-2">
                <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">
                  {lang === "th" ? "ตัวเลือกสินค้า" : "Product Options"}
                </Label>
                <Textarea
                  name="options"
                  rows={3}
                  placeholder="สีดำ / M | /images/black-m.jpg"
                  className="rounded-xl border-gray-200 text-xs resize-none"
                />
                <p className="mt-1 text-[9px] font-bold text-gray-400">
                  {lang === "th" ? "ใส่ 1 ตัวเลือกต่อบรรทัด: ชื่อตัวเลือก | URL รูป" : "One option per line: label | image URL"}
                </p>
              </div>
              <div className="col-span-2">
                <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">{t("admin.products.label.description")}</Label>
                <Textarea name="description" rows={2} className="rounded-xl border-gray-200 text-xs resize-none" />
              </div>
            </div>

            <Button type="submit" className="bg-[#85241F] hover:bg-[#B72D2A] rounded-xl h-11 w-full text-xs font-bold shadow-md shadow-[#85241F]/10 cursor-pointer transition-all active:scale-98">
              <PackagePlus className="w-4 h-4 mr-1" /> {t("admin.products.add_title")}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ─── Product Card ───────────────────────────────────────────────────────── */

function ProductCard({ product, onUpdate, onDelete, t }: {
  product: Product;
  onUpdate: (p: Product) => void;
  onDelete: (id: string) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({ ...product });
  const [imagePreview, setImagePreview] = React.useState(product.imageUrl ?? "");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const translatedName = t(`product.${product.id}.name`) === `product.${product.id}.name` ? product.name : t(`product.${product.id}.name`);

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
      <div className="bg-white rounded-3xl border border-[#85241F]/30 overflow-hidden shadow-md col-span-2 sm:col-span-1 animate-in zoom-in-95 duration-200">
        {/* Image preview */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {imagePreview
            ? <img src={imagePreview} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-300" /></div>}
          <button type="button" onClick={() => fileRef.current?.click()}
            className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-xs rounded-full px-2.5 py-1.5 text-[9px] font-black shadow-sm flex items-center gap-1 border border-gray-100 cursor-pointer hover:bg-gray-50">
            <Upload className="w-3 h-3 text-[#85241F]" /> {t("admin.products.edit.change_image")}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>

        <div className="p-3 flex flex-col gap-2.5">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="ชื่อสินค้า" className="rounded-xl border-gray-200 text-xs h-9 font-semibold" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">{t("admin.products.label.price")}</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="rounded-xl border-gray-200 text-xs h-9" />
            </div>
            <div>
              <Label className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">{t("admin.products.label.stock")}</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
                className="rounded-xl border-gray-200 text-xs h-9" />
            </div>
          </div>
          <div>
            <Label className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Category</Label>
            <Input value={form.category ?? ""} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="raincoat" className="rounded-xl border-gray-200 text-xs h-9" />
          </div>
          <div>
            <Label className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Options</Label>
            <Textarea
              value={productOptionsText(form.options)}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  options: parseProductOptions(e.target.value),
                }))
              }
              placeholder="สีดำ / M | /images/black-m.jpg"
              className="rounded-xl border-gray-200 text-xs resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-2 mt-1 border-t border-gray-50 pt-2.5">
            <Button onClick={handleSave} className="flex-1 bg-[#85241F] hover:bg-[#B72D2A] rounded-xl h-9 text-[10px] font-bold shadow-sm cursor-pointer transition-all active:scale-97">
              {t("admin.products.edit.save")}
            </Button>
            <Button onClick={() => setEditing(false)} variant="outline" className="flex-1 rounded-xl h-9 text-[10px] font-bold cursor-pointer transition-all active:scale-97">
              {t("admin.modal.cancel")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-md hover:border-gray-200/80 transition-all duration-200 flex flex-col group">
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {imagePreview
          ? <img src={imagePreview} alt={translatedName} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-300" /></div>}
        {/* Action buttons with nice group hover reveal */}
        <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          <button onClick={() => setEditing(true)}
            className="w-7.5 h-7.5 bg-white/95 backdrop-blur-xs rounded-full shadow flex items-center justify-center hover:bg-gray-100 border border-gray-100 cursor-pointer transition-colors shadow-slate-200/50">
            <Pencil className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button onClick={() => { if (confirm(t("admin.products.edit.delete_confirm"))) onDelete(product.id); }}
            className="w-7.5 h-7.5 bg-white/95 backdrop-blur-xs rounded-full shadow flex items-center justify-center hover:bg-red-50 border border-gray-100 cursor-pointer transition-colors shadow-slate-200/50">
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <p className="font-extrabold text-xs text-gray-800 truncate leading-tight">{translatedName}</p>
        {product.category ? (
          <p className="mt-1 inline-flex w-fit items-center rounded-md bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
            {product.category}
          </p>
        ) : null}
        {product.options?.length ? (
          <p className="mt-1 text-[9px] font-bold text-gray-400">
            {productOptionLabels(product.options)}
          </p>
        ) : null}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
          <div>
            <span className="font-black text-[#85241F] text-xs">{money(product.price)}</span>
          </div>
          <span className="text-[10px] text-gray-400 font-bold bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">{product.stock} {t("admin.products.edit.units")}</span>
        </div>
      </div>
    </div>
  );
}
