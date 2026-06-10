"use client";

import * as React from "react";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  PackagePlus,
  CheckCircle2,
} from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/client/language-context";
import type { Order, OrderStatus, Product } from "@/components/admin/types";
import * as ordersApi from "@/lib/modules/orders";
import * as productsApi from "@/lib/modules/products";
import * as adminUsersApi from "@/lib/modules/admin-users";
import type { AdminRole, AdminUser, AuditLog, CurrentAdmin } from "@/lib/modules/admin-users";
import * as settingsApi from "@/lib/modules/settings";
import type { PaymentSettings } from "@/lib/modules/settings";
import { PaymentAccountPanel } from "@/components/admin/payment-account-panel";
import AddProductForm from "@/components/admin/add-product-form";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AppHeader, type NavItem } from "@/components/shared/app-header";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminStats } from "@/components/admin/admin-stats";
import { OrdersPanel } from "@/components/admin/orders-panel";
import { ProductsPanel } from "@/components/admin/products-panel";
import { ConfirmationModal } from "@/components/admin/confirmation-modal";
import { SuperAdminPanel } from "@/components/admin/super-admin-panel";

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
  const [adminUsers, setAdminUsers] = React.useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [paymentSettings, setPaymentSettings] = React.useState<PaymentSettings | null>(null);
  const { lang, t } = useLanguage();

  const [loading, setLoading] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<CurrentAdmin | null>(null);
  const [loginLoading, setLoginLoading] = React.useState(false);

  async function handleLogout() {
    await adminUsersApi.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
  }

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  React.useEffect(() => {
    let mounted = true;

    adminUsersApi.fetchSession()
      .then((res) => {
        if (!mounted || !res.data?.authenticated || !res.data.user) return;
        setCurrentUser(res.data.user);
        setIsLoggedIn(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const loadSuperAdminData = React.useCallback(async () => {
    if (currentUser?.role !== "superAdmin") return;

    const [usersRes, logsRes, settingsRes] = await Promise.all([
      adminUsersApi.fetchAdminUsers(),
      adminUsersApi.fetchAuditLogs(),
      settingsApi.fetchAdminPaymentSettings(),
    ]);
    if (usersRes.data) setAdminUsers(usersRes.data);
    if (logsRes.data) setAuditLogs(logsRes.data);
    if (settingsRes.data) setPaymentSettings(settingsRes.data);
  }, [currentUser]);

  const savePaymentSettings = React.useCallback(async (input: PaymentSettings) => {
    setLoading(true);
    const res = await settingsApi.updatePaymentSettings(input);
    setLoading(false);
    if (res.error) { notify(res.error); return; }
    if (res.data) setPaymentSettings(res.data);
    notify(lang === "th" ? "บันทึกบัญชีรับเงินแล้ว" : "Payment account saved");
    void loadSuperAdminData();
  }, [lang, loadSuperAdminData]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    const [ordersRes, productsRes] = await Promise.all([
      ordersApi.fetchAdminOrders(),
      productsApi.fetchAdminProducts(),
    ]);

    if (ordersRes.data) {
      setOrders(ordersRes.data.filter((order) => !order.id.startsWith("demo-")));
    } else {
      setOrders([]);
    }
    if (productsRes.data) setProducts(productsRes.data);
    if (currentUser?.role === "superAdmin") {
      await loadSuperAdminData();
    }
    setLoading(false);
  }, [currentUser, loadSuperAdminData]);

  React.useEffect(() => {
    if (!isLoggedIn) return;
    const run = async () => {
      await loadData();
    };
    void run();
  }, [isLoggedIn, loadData]);

  React.useEffect(() => {
    if (!isLoggedIn) return;

    if (currentUser?.role === "superAdmin") {
      void Promise.resolve().then(loadSuperAdminData);
    }

    const events = new EventSource("/api/backend/admin/realtime");
    events.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as { type?: string };
        if (data.type === "orders-updated") void loadData();
        if (data.type === "super-admin-data" && currentUser?.role === "superAdmin") void loadSuperAdminData();
      } catch { void loadData(); }
    };

    return () => events.close();
  }, [currentUser, isLoggedIn, loadData, loadSuperAdminData]);

  const pendingSlips = orders.filter((o) => o.slip.status === "pending");

  async function handleLogin(form: HTMLFormElement) {
    setLoginLoading(true);

    const fd = new FormData(form);
    const res = await adminUsersApi.login(
      String(fd.get("username") ?? "").trim(),
      String(fd.get("password") ?? ""),
    );

    setLoginLoading(false);
    if (res.error || !res.data?.user) return false;

    setCurrentUser(res.data.user);
    setIsLoggedIn(true);
    return true;
  }

  async function createAdminAccount(formData: FormData) {
    const username = String(formData.get("username") ?? "").trim();
    const role = String(formData.get("role") ?? "admin") as AdminRole;
    if (!username) return;

    setLoading(true);
    const res = await adminUsersApi.createAdminUser(username, role);
    setLoading(false);

    if (res.error) {
      notify(res.error);
      return;
    }

    notify(`Created: ${res.data?.username ?? username}`);
    await loadSuperAdminData();
  }

  async function deleteAdminUser(username: string) {
    const res = await adminUsersApi.deleteAdminUser(username);
    if (res.error) { notify(res.error); return; }
    notify(`ลบ ${username} แล้ว`);
    await loadSuperAdminData();
  }

  async function resetAdminPassword(username: string) {
    const res = await adminUsersApi.resetAdminPassword(username);
    if (res.error) { notify(res.error); return; }
    notify(`รีเซ็ตรหัสผ่านของ ${username} แล้ว ต้องตั้งรหัสใหม่ที่ /admin/register`);
    await loadSuperAdminData();
  }

  async function callSlipApi(orderId: string, approved: boolean, note?: string) {
    setLoading(true);
    const res = await ordersApi.reviewPaymentSlip(orderId, approved, "admin", note);
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
    const res = await ordersApi.updateAdminOrder(orderId, { status });
    setLoading(false);
    if (res.error) {
      notify(res.error);
    } else {
      notify(t("admin.toast.product_updated"));
      loadData();
    }
  }

  async function saveTracking(orderId: string, trackingNumber: string) {
    const res = await ordersApi.updateAdminOrder(orderId, { trackingNumber });
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
    const res = await ordersApi.updateAdminOrder(orderId, { cancel: true, reason });
    setLoading(false);
    if (res.error) {
      notify(res.error);
    } else {
      notify("ยกเลิกคำสั่งซื้อแล้ว");
      loadData();
    }
  }

  async function addProduct(formData: FormData) {
    const nameTh = String(formData.get("name") ?? "").trim();
    if (!nameTh) return;
    setLoading(true);
    const res = await productsApi.createProduct({
      name: {
        th: nameTh,
        en: String(formData.get("nameEn") ?? "").trim() || undefined,
      },
      slug: nameTh.toLowerCase().replace(/\s+/g, "-"),
      description: {
        th: String(formData.get("description") ?? "").trim(),
        en: String(formData.get("descriptionEn") ?? "").trim() || undefined,
      },
      price: Number(formData.get("price")) || 0,
      stock: Number(formData.get("stock")) || 0,
      shippingFirstItem: Number(formData.get("shippingFirstItem")) || 0,
      shippingAdditionalItem: Number(formData.get("shippingAdditionalItem")) || 0,
      discount: Number(formData.get("discount")) || undefined,
      imageUrl: String(formData.get("imageUrl") ?? "").trim() || undefined,
      imageUrls: (() => {
        try {
          return JSON.parse(String(formData.get("imageUrls") ?? "[]"));
        } catch {
          return undefined;
        }
      })(),
      options: (() => {
        try {
          return JSON.parse(String(formData.get("options") ?? "[]"));
        } catch {
          return undefined;
        }
      })(),
      active: true,
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
    const res = await productsApi.updateProduct(updated);
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
    const res = await productsApi.deleteProduct(id);
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
    return <AdminLogin onLogin={handleLogin} loading={loginLoading} />;
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
        isSuperAdmin={currentUser?.role === "superAdmin"}
        onLogout={handleLogout}
      />

      <div className="lg:hidden">
        <AppHeader
          showCart={false}
          logoHref="/admin"
          onLogoClick={() => setActiveTab("dashboard")}
          navItems={[
            { label: t("admin.tab.dashboard"), icon: LayoutDashboard, onClick: () => setActiveTab("dashboard") },
            { label: t("admin.tab.orders"),    icon: ClipboardList,   onClick: () => setActiveTab("orders"),   badge: pendingSlips.length },
            { label: t("admin.tab.products"),  icon: Package,         onClick: () => setActiveTab("products") },
            ...(currentUser?.role === "superAdmin"
              ? [{ label: "SuperAdmin", icon: LayoutDashboard, onClick: () => setActiveTab("superAdmin") } as NavItem]
              : []),
            { label: "Logout", icon: LogOut, onClick: handleLogout },
          ]}
        />
      </div>

      <div className="lg:pl-56 xl:pl-64 pt-14 lg:pt-0">
        <div className="max-w-240 mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>

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
            {currentUser?.role === "superAdmin" ? (
              <TabsContent value="superAdmin" className="mt-4 animate-in fade-in duration-200">
                <div className="flex flex-col gap-4">
                  <PaymentAccountPanel
                    key={paymentSettings ? "loaded" : "empty"}
                    settings={paymentSettings}
                    loading={loading}
                    onSave={savePaymentSettings}
                  />
                  <SuperAdminPanel
                    adminUsers={adminUsers}
                    auditLogs={auditLogs}
                    loading={loading}
                    onCreateAccount={createAdminAccount}
                    onDeleteUser={deleteAdminUser}
                    onResetPassword={resetAdminPassword}
                    currentUsername={currentUser.username}
                  />
                </div>
              </TabsContent>
            ) : null}
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
