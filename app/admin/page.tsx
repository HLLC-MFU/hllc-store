"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Globe,
  LayoutDashboard,
  Package,
  PackagePlus,
  Search,
  TrendingUp,
  Truck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/language-context";
import type { Order, OrderStatus, Product } from "@/components/admin/types";
import { ORDER_STATUSES } from "@/components/admin/types";
import { api, isPickupOrder, money } from "@/components/admin/utils";
import OrderRow from "@/components/admin/order-row";
import AddProductForm from "@/components/admin/add-product-form";
import ProductCard from "@/components/admin/product-card";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AppHeader } from "@/components/shared/app-header";

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

export default function AdminPage() {
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [productSearch, setProductSearch] = React.useState("");
  const [showAddProduct, setShowAddProduct] = React.useState(false);
  const [editProduct, setEditProduct] = React.useState<Product | null>(null);
  const [shippingFilter, setShippingFilter] = React.useState<"all" | "delivery" | "pickup">("all");
  const [toast, setToast] = React.useState("");
  const [confirm, setConfirm] = React.useState<{ orderId: string; approved: boolean; note?: string } | null>(null);
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
  // สถานะที่ซ่อนใน "ทั้งหมด" — completed จบแล้วไม่ต้องทำอะไร, shipped ยังต้อง track อยู่
  const HIDDEN_FROM_ALL: OrderStatus[] = ["completed"];

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === "all"
      ? !HIDDEN_FROM_ALL.includes(o.status)
      : o.status === statusFilter;

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

  async function callSlipApi(orderId: string, approved: boolean, note?: string) {
    setLoading(true);
    const res = await api<Order>(`/api/backend/admin/slips/${orderId}`, {
      method: "POST",
      body: JSON.stringify({ approved, reviewedBy: "admin", note }),
    });
    setLoading(false);
    if (res.error) {
      notify(res.error);
    } else {
      notify(approved ? t("admin.toast.slip_approved") : t("admin.toast.slip_rejected"));
      if (res.data) {
        setOrders((current) =>
          current.map((order) => (order.id === res.data?.id ? res.data : order)),
        );
      }
      loadData();
    }
  }

  function approveSlip(orderId: string, approved: boolean, note?: string) {
    setConfirm({ orderId, approved, note });
  }

  async function confirmApprove() {
    if (!confirm) return;
    await callSlipApi(confirm.orderId, confirm.approved, confirm.note);
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

  async function saveTracking(orderId: string, trackingNumber: string) {
    const res = await api<Order>(`/api/backend/admin/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ trackingNumber }),
    });
    if (res.error) {
      notify(res.error);
    } else {
      notify("บันทึกหมายเลขพัสดุแล้ว");
      if (res.data) {
        setOrders((curr) => curr.map((o) => o.id === res.data?.id ? res.data : o));
      }
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

  async function cancelOrder(orderId: string, reason: string) {
    setLoading(true);
    const res = await api<Order>(`/api/backend/admin/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ cancel: true, reason }),
    });
    setLoading(false);
    if (res.error) {
      notify(res.error);
    } else {
      notify("ยกเลิกคำสั่งซื้อแล้ว");
      if (res.data) {
        setOrders((curr) => curr.map((o) => o.id === res.data?.id ? res.data : o));
      }
    }
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
        discount: Number(formData.get("discount")) || undefined,
        category: String(formData.get("category") ?? "").trim() || undefined,
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
        discount: updated.discount,
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
  const statsRevenue = orders.reduce((sum, o) => ["packing", "shipped", "completed"].includes(o.status) ? sum + o.total : sum, 0);
  const statsPending = pendingSlips.length;
  const statsPacking = orders.filter(o => o.status === "packing").length;
  const statsShipped = orders.filter(o => o.status === "shipped").length;
  const statsTotal = orders.length;
  const filteredProducts = React.useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return products.filter((product) =>
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
  }, [products, productSearch]);

  // Suppress unused loading warning — loading is used for UX signaling via state
  void loading;

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
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-4xl p-8 shadow-2xl flex flex-col gap-6 relative z-10 animate-in fade-in zoom-in-95 duration-500">

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
            <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-[#85241F] to-[#b8332b] flex items-center justify-center shadow-lg shadow-[#85241F]/35 mb-4 animate-pulse">
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
              <Label className="text-[9px] text-white/50 font-bold uppercase tracking-wider pl-1">{t("admin.login.username")}</Label>
              <Input
                name="username"
                type="text"
                required
                defaultValue="admin"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#85241F] focus:ring-1 focus:ring-[#85241F] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[9px] text-white/50 font-bold uppercase tracking-wider pl-1">{t("admin.login.password")}</Label>
              <Input
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

            <Button
              type="submit"
              className="w-full bg-linear-to-r from-[#85241F] to-[#b8332b] hover:opacity-95 text-white font-black py-3.5 px-4 rounded-2xl text-xs shadow-lg shadow-[#85241F]/20 active:scale-98 transition-all cursor-pointer mt-2"
            >
              {t("admin.login.button")}
            </Button>
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
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${confirm.approved ? "bg-emerald-50" : "bg-red-50"}`}>
                {confirm.approved
                  ? <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  : <XCircle className="w-7 h-7 text-red-500" />}
              </div>
              <h3 className="font-bold text-lg text-gray-900">
                {confirm.approved ? t("admin.modal.approve_title") : t("admin.modal.reject_title")}
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {confirm.approved ? t("admin.modal.approve_desc") : t("admin.modal.reject_desc")}
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => setConfirm(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                {t("admin.modal.cancel")}
              </Button>
              <Button onClick={confirmApprove}
                className={`flex-1 py-3 rounded-2xl text-xs font-bold text-white cursor-pointer transition-all shadow-md active:scale-98 ${confirm.approved ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-red-500 hover:bg-red-600 shadow-red-500/20"}`}>
                {confirm.approved ? t("admin.slip.approve") : t("admin.slip.reject")}
              </Button>
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
              <Button variant="outline" onClick={() => setStatusConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                {t("admin.modal.cancel")}
              </Button>
              <Button onClick={confirmStatusChange}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all shadow-md active:scale-98 ${statusConfirm.status === "cancelled"
                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                    : "bg-[#85241F] hover:bg-[#B72D2A] shadow-[#85241F]/20"
                  }`}>
                {t("admin.modal.confirm")}
              </Button>
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

      {/* Sidebar — desktop only */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingSlips.length}
        orderCount={orders.length}
        productCount={products.length}
      />

      {/* Mobile header — hidden on desktop */}
      <div className="lg:hidden">
        <AppHeader />
      </div>

      <div className="lg:pl-56 xl:pl-64">
        <div className="max-w-240 mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="lg:hidden w-full grid grid-cols-3 bg-transparent h-auto gap-2 p-0">
            <TabsTrigger value="dashboard" className="h-11 rounded-2xl font-bold text-xs gap-1.5 transition-all cursor-pointer border-2 border-gray-200 text-gray-900 bg-white data-[state=active]:border-[#85241F] data-[state=active]:text-[#85241F] data-[state=active]:shadow-sm">
              <LayoutDashboard className="w-4 h-4" />
              หน้าหลัก
            </TabsTrigger>
            <TabsTrigger value="orders" className="h-11 rounded-2xl font-bold text-xs gap-1.5 transition-all cursor-pointer border-2 border-gray-200 text-gray-900 bg-white data-[state=active]:border-[#85241F] data-[state=active]:text-[#85241F] data-[state=active]:shadow-sm">
              <ClipboardList className="w-4 h-4" />
              {t("admin.tab.orders")}
              {pendingSlips.length > 0 && (
                <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">{pendingSlips.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="products" className="h-11 rounded-2xl font-bold text-xs gap-1.5 transition-all cursor-pointer border-2 border-gray-200 text-gray-900 bg-white data-[state=active]:border-[#85241F] data-[state=active]:text-[#85241F] data-[state=active]:shadow-sm">
              <Package className="w-4 h-4" />
              {t("admin.tab.products")}
            </TabsTrigger>
          </TabsList>

          {/* ── Dashboard Tab ── */}
          <TabsContent value="dashboard" className="mt-5 animate-in fade-in duration-200">
            <div className="flex flex-col gap-6">
              <h2 className="font-black text-gray-900 text-lg">หน้าหลัก</h2>

              {/* Stats — revenue ใหญ่สุด + 3 card เล็กข้างล่าง */}
              <div className="flex flex-col gap-3">
                {/* Revenue — full width */}
                <Card className="border-emerald-100 rounded-2xl shadow-sm transition-all">
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">ยอดขายรวม</span>
                        <span className="text-4xl font-black text-gray-900 tracking-tight">{money(statsRevenue)}</span>
                        <span className="text-xs text-gray-400 mt-0.5">ยอดขายสะสม</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shrink-0">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* 2x2 grid */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border-slate-100/80 rounded-2xl shadow-xs hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col gap-1.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">คำสั่งซื้อทั้งหมด</span>
                      <span className="text-2xl font-black text-gray-900">{statsTotal}</span>
                    </CardContent>
                  </Card>

                  <Card className={`rounded-2xl shadow-xs transition-all relative overflow-hidden ${statsPending > 0 ? "border-rose-200 ring-2 ring-rose-500/5" : "border-gray-100"}`}>
                    <CardContent className="p-4 flex flex-col gap-1.5">
                      {statsPending > 0 && <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${statsPending > 0 ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-gray-50 text-gray-400 border-gray-100"}`}>
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">รอตรวจสลิป</span>
                      <span className={`text-2xl font-black ${statsPending > 0 ? "text-rose-500" : "text-gray-900"}`}>{statsPending}</span>
                    </CardContent>
                  </Card>

                  <Card className="border-yellow-100/80 rounded-2xl shadow-xs hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col gap-1.5">
                      <div className="w-9 h-9 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center border border-yellow-100">
                        <Package className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">เตรียมจัดส่ง</span>
                      <span className="text-2xl font-black text-gray-900">{statsPacking}</span>
                    </CardContent>
                  </Card>

                  <Card className="border-sky-100/80 rounded-2xl shadow-xs hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col gap-1.5">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center border border-sky-100">
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">จัดส่งแล้ว</span>
                      <span className="text-2xl font-black text-gray-900">{statsShipped}</span>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Pending slips — ต้องดูแลด่วน */}
              {pendingSlips.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-rose-500" />
                    รอตรวจสลิป
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{pendingSlips.length}</span>
                  </h3>
                  <div className="flex flex-col gap-2">
                    {pendingSlips.slice(0, 5).map((order) => (
                      <Card key={order.id} className="rounded-2xl shadow-xs cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("orders")}>
                        <CardContent className="p-4 flex items-center gap-3">
                          <FileCheck2 className="w-4 h-4 text-rose-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{order.customer.name}</p>
                            <p className="text-xs text-gray-400 truncate">{order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}</p>
                          </div>
                          <span className="font-black text-sm text-gray-900 shrink-0">{money(order.total)}</span>
                        </CardContent>
                      </Card>
                    ))}
                    {pendingSlips.length > 5 && (
                      <button onClick={() => setActiveTab("orders")} className="text-xs text-[#85241F] font-bold text-center py-2 hover:underline cursor-pointer">
                        ดูทั้งหมด {pendingSlips.length} รายการ →
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </TabsContent>

          {/* ── Orders Tab ── */}
          <TabsContent value="orders" className="mt-5 animate-in fade-in duration-200">
            <div className="flex flex-col lg:flex-row gap-5">

              {/* LEFT PANEL — Filters */}
              <div className="lg:w-72 xl:w-80 shrink-0 flex flex-col gap-4">

                {/* Shipping toggle */}
                <Card className="rounded-2xl shadow-xs">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">ประเภทการจัดส่ง</span>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {([
                        { key: "all",      label: "ทั้งหมด", active: "bg-slate-800 text-white shadow-sm", dot: "bg-slate-400" },
                        { key: "delivery", label: "จัดส่ง",   active: "bg-blue-500 text-white shadow-sm",  dot: "bg-blue-400" },
                        { key: "pickup",   label: "รับเอง",   active: "bg-amber-500 text-white shadow-sm", dot: "bg-amber-400" },
                      ] as const).map((opt) => {
                        const isActive = shippingFilter === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => setShippingFilter(opt.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${isActive ? opt.active : "text-slate-400 hover:text-slate-700"}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-white" : opt.dot}`} />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Status filter — desktop only vertical list */}
                <Card className="hidden lg:block rounded-2xl shadow-xs">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">สถานะ</span>
                    <div className="flex flex-col gap-1.5">
                      {(["all", ...ORDER_STATUSES] as const).map((s) => {
                        const count = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
                        if (count === 0 && s !== "all") return null;
                        const isActive = statusFilter === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isActive ? "bg-[#85241F] text-white" : "bg-slate-50 text-gray-600 hover:bg-slate-100"
                            }`}
                          >
                            <span>{s === "all" ? t("admin.orders.filter_all") : t(`admin.status.${s as OrderStatus}`)}</span>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${isActive ? "bg-white/20 text-white" : "bg-white text-gray-500"}`}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT PANEL — Search + Order list */}
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <h2 className="font-bold text-gray-900 text-sm">{t("admin.orders.all")}</h2>

                {/* Status pills — mobile only */}
                <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {(["all", ...ORDER_STATUSES] as const).map((s) => {
                    const count = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
                    if (count === 0 && s !== "all") return null;
                    const isActive = statusFilter === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all cursor-pointer border-2 ${
                          isActive
                            ? "bg-[#85241F] text-white border-[#85241F] shadow-md shadow-[#85241F]/20"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {s === "all" ? t("admin.orders.filter_all") : t(`admin.status.${s as OrderStatus}`)}
                        <span className={`text-xs font-black px-1.5 py-0.5 rounded-lg ${
                          isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                        }`}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Search */}
                <div className="bg-white border border-gray-200/60 rounded-2xl px-4 py-3 shadow-2xs flex items-center gap-3 focus-within:border-[#85241F] focus-within:ring-2 focus-within:ring-[#85241F]/5 transition-all">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("admin.orders.search_placeholder")}
                    className="flex-1 bg-transparent border-none text-xs text-gray-800 placeholder:text-gray-400 shadow-none focus-visible:ring-0 p-0 h-auto"
                  />
                  {searchQuery && (
                    <Button variant="ghost" size="icon" onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 cursor-pointer h-auto w-auto p-0">
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                {/* Order list */}
                <div className="flex flex-col gap-3">
                  {filteredOrders.map((order) => (
                    <OrderRow key={order.id} order={order} onStatusChange={triggerStatusConfirm} onApproveSlip={approveSlip} onSaveTracking={saveTracking} onCancel={cancelOrder} t={t} onViewSlip={setLightbox} />
                  ))}
                  {filteredOrders.length === 0 && (
                    <div className="bg-white border border-gray-100 rounded-3xl py-16 flex flex-col items-center justify-center text-center shadow-2xs">
                      <AlertCircle className="w-8 h-8 text-gray-300 animate-pulse mb-2" />
                      <p className="text-xs text-gray-400 font-semibold">{t("admin.orders.empty")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Products Tab ── */}
          <TabsContent value="products" className="mt-4 animate-in fade-in duration-200">
            <div className="flex flex-col gap-4">

              {/* Header row — title + search */}
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-gray-900 text-sm shrink-0">{t("admin.tab.products")}</h2>
                <div className="flex-1 flex items-center gap-3 rounded-2xl border border-gray-200/60 bg-white px-4 py-3 shadow-2xs focus-within:border-[#85241F] focus-within:ring-2 focus-within:ring-[#85241F]/5 transition-all">
                  <Search className="h-4 w-4 shrink-0 text-gray-400" />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={lang === "th" ? "ค้นหาสินค้า..." : "Search products..."}
                    className="flex-1 border-none bg-transparent text-xs text-gray-800 placeholder:text-gray-400 shadow-none focus-visible:ring-0 p-0 h-auto"
                  />
                  {productSearch && (
                    <Button variant="ghost" size="icon" onClick={() => setProductSearch("")} className="text-gray-400 hover:text-gray-600 h-auto w-auto p-0">
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Product grid — full width */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                  {filteredProducts.map((p) => (
                    <ProductCard key={p.id} product={p} onUpdate={updateProduct} onDelete={deleteProduct} onEdit={setEditProduct} t={t} />
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-3xl py-16 flex flex-col items-center justify-center text-center shadow-2xs">
                  <Package className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400 font-semibold">{t("admin.products.empty")}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* FAB — เพิ่มสินค้า */}
      {activeTab === "products" && (
        <button
          onClick={() => setShowAddProduct(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#85241F] hover:bg-[#B72D2A] text-white rounded-full shadow-xl shadow-[#85241F]/30 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
        >
          <PackagePlus className="w-6 h-6" />
        </button>
      )}

      {/* Add Product Modal */}
      <AddProductForm
        onSubmit={addProduct}
        notify={notify}
        t={t}
        open={showAddProduct}
        onClose={() => setShowAddProduct(false)}
      />

      {/* Edit Product Modal — remounts per product via key */}
      {editProduct && (
        <AddProductForm
          key={editProduct.id}
          onSubmit={addProduct}
          onUpdate={updateProduct}
          notify={notify}
          t={t}
          open={true}
          onClose={() => setEditProduct(null)}
          product={editProduct}
        />
      )}
    </main>
  );
}
