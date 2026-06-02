"use client";

import * as React from "react";
import {
  ClipboardList,
  LayoutDashboard,
  Package,
  PackagePlus,
  CheckCircle2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/language-context";
import type { Order, OrderStatus, Product } from "@/components/admin/types";
import { api } from "@/components/admin/utils";
import AddProductForm from "@/components/admin/add-product-form";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AppHeader } from "@/components/shared/app-header";

// Refactored modular components
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminStats } from "@/components/admin/admin-stats";
import { OrdersPanel } from "@/components/admin/orders-panel";
import { ProductsPanel } from "@/components/admin/products-panel";
import { ConfirmationModal } from "@/components/admin/confirmation-modal";

export default function AdminPage() {
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [showAddProduct, setShowAddProduct] = React.useState(false);
  const [editProduct, setEditProduct] = React.useState<Product | null>(null);
  const [toast, setToast] = React.useState("");
  const [confirm, setConfirm] = React.useState<{ orderId: string; approved: boolean; note?: string } | null>(null);
  const [statusConfirm, setStatusConfirm] = React.useState<{ orderId: string; status: OrderStatus } | null>(null);
  const [lightbox, setLightbox] = React.useState<string | null>(null);
  const { lang, t } = useLanguage();

  const [loading, setLoading] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

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

    if (ordersRes.data) setOrders(ordersRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (!isLoggedIn) return;
    const run = async () => {
      await loadData();
    };
    void run();
  }, [isLoggedIn, loadData]);

  const pendingSlips = orders.filter((o) => o.slip.status === "pending");

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
      loadData();
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
        nameEn: String(formData.get("nameEn") ?? "").trim() || undefined,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description: String(formData.get("description") ?? "").trim() || undefined,
        descriptionEn: String(formData.get("descriptionEn") ?? "").trim() || undefined,
        price: Number(formData.get("price")) || 0,
        stock: Number(formData.get("stock")) || 0,
        discount: Number(formData.get("discount")) || undefined,
        category: String(formData.get("category") ?? "").trim() || undefined,
        imageUrl: String(formData.get("imageUrl") ?? "").trim() || undefined,
        imageUrls: (() => {
          try {
            return JSON.parse(String(formData.get("imageUrls") ?? "[]"));
          } catch {
            return undefined;
          }
        })(),
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
      body: JSON.stringify(updated),
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

  void loading;

  if (!isLoggedIn) {
    return <AdminLogin onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <ConfirmationModal
        confirm={confirm}
        setConfirm={setConfirm}
        confirmApprove={confirmApprove}
        statusConfirm={statusConfirm}
        setStatusConfirm={setStatusConfirm}
        confirmStatusChange={confirmStatusChange}
        lightbox={lightbox}
        setLightbox={setLightbox}
      />

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl border border-white/10 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}

      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingSlips.length}
        orderCount={orders.length}
        productCount={products.length}
      />

      <div className="lg:hidden">
        <AppHeader />
      </div>

      <div className="lg:pl-56 xl:pl-64">
        <div className="max-w-240 mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="lg:hidden w-full grid grid-cols-3 bg-transparent h-auto gap-2 p-0">
              <TabsTrigger
                value="dashboard"
                className="h-11 rounded-2xl font-bold text-xs gap-1.5 transition-all cursor-pointer border-2 border-gray-200 text-gray-900 bg-white data-[state=active]:border-[#85241F] data-[state=active]:text-[#85241F] data-[state=active]:shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                หน้าหลัก
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="h-11 rounded-2xl font-bold text-xs gap-1.5 transition-all cursor-pointer border-2 border-gray-200 text-gray-900 bg-white data-[state=active]:border-[#85241F] data-[state=active]:text-[#85241F] data-[state=active]:shadow-sm"
              >
                <ClipboardList className="w-4 h-4" />
                {t("admin.tab.orders")}
                {pendingSlips.length > 0 && (
                  <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                    {pendingSlips.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="h-11 rounded-2xl font-bold text-xs gap-1.5 transition-all cursor-pointer border-2 border-gray-200 text-gray-900 bg-white data-[state=active]:border-[#85241F] data-[state=active]:text-[#85241F] data-[state=active]:shadow-sm"
              >
                <Package className="w-4 h-4" />
                {t("admin.tab.products")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-5 animate-in fade-in duration-200">
              <AdminStats
                orders={orders}
                pendingSlips={pendingSlips}
                setActiveTab={setActiveTab}
                t={t}
              />
            </TabsContent>

            <TabsContent value="orders" className="mt-5 animate-in fade-in duration-200">
              <OrdersPanel
                orders={orders}
                onStatusChange={triggerStatusConfirm}
                onApproveSlip={approveSlip}
                onSaveTracking={saveTracking}
                onCancelOrder={cancelOrder}
                t={t}
                onViewSlip={setLightbox}
              />
            </TabsContent>

            <TabsContent value="products" className="mt-4 animate-in fade-in duration-200">
              <ProductsPanel
                products={products}
                onUpdateProduct={updateProduct}
                onDeleteProduct={deleteProduct}
                onEditProduct={setEditProduct}
                lang={lang}
                t={t}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {activeTab === "products" && (
        <button
          onClick={() => setShowAddProduct(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#85241F] hover:bg-[#B72D2A] text-white rounded-full shadow-xl shadow-[#85241F]/30 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
        >
          <PackagePlus className="w-6 h-6" />
        </button>
      )}

      <AddProductForm
        onSubmit={addProduct}
        notify={notify}
        t={t}
        open={showAddProduct}
        onClose={() => setShowAddProduct(false)}
      />

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
