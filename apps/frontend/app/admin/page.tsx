"use client";

import * as React from "react";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  PackagePlus,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/client/language-context";
import type { Order, OrderStatus, Product } from "@/components/admin/types";
import * as ordersApi from "@/lib/modules/orders";
import { isPickupOrder } from "@/components/admin/api-client";
import * as productsApi from "@/lib/modules/products";
import * as adminUsersApi from "@/lib/modules/admin-users";
import type { AdminRole, AdminUser, AuditLog, CurrentAdmin } from "@/lib/modules/admin-users";
import * as settingsApi from "@/lib/modules/settings";
import type { PaymentSettings, ShippingSettings } from "@/lib/modules/settings";
import { placementByValue } from "@/lib/config/catalog";
import { HomeContentPanel } from "@/components/admin/home-content-panel";
import { PaymentAccountPanel } from "@/components/admin/payment-account-panel";
import { ShippingSettingsPanel } from "@/components/admin/shipping-settings-panel";
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
  const [toast, setToast] = React.useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [confirm, setConfirm] = React.useState<{ orderId: string; approved: boolean; note?: string } | null>(null);
  const [statusConfirm, setStatusConfirm] = React.useState<{ orderId: string; status: OrderStatus; isPickup?: boolean } | null>(null);
  const [lightbox, setLightbox] = React.useState<{ images: string[]; index: number } | null>(null);
  const [ordersFilter, setOrdersFilter] = React.useState<string>("all");
  const [adminUsers, setAdminUsers] = React.useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [paymentSettings, setPaymentSettings] = React.useState<PaymentSettings | null>(null);
  const [shippingSettings, setShippingSettings] = React.useState<ShippingSettings | null>(null);
  const { lang, t, setLang } = useLanguage();
  React.useEffect(() => { setLang("th"); }, [setLang]);

  const [loading, setLoading] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<CurrentAdmin | null>(null);
  const [loginLoading, setLoginLoading] = React.useState(false);

  async function handleLogout() {
    await adminUsersApi.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
  }

  function friendlyError(raw: string): string {
    if (raw.includes("E11000") || raw.includes("duplicate key")) {
      if (raw.includes("slug")) return "ชื่อสินค้านี้ซ้ำกับที่มีอยู่แล้ว ลองเปลี่ยนชื่อหรือเพิ่มคำต่อท้ายดูครับ";
      return "ข้อมูลซ้ำกับที่มีอยู่แล้วในระบบ";
    }
    return raw;
  }

  const notify = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg: type === "error" ? friendlyError(msg) : msg, type });
    setTimeout(() => setToast(null), 3500);
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

    const [usersRes, logsRes, settingsRes, shippingRes] = await Promise.all([
      adminUsersApi.fetchAdminUsers(),
      adminUsersApi.fetchAuditLogs(),
      settingsApi.fetchAdminPaymentSettings(),
      settingsApi.fetchAdminShippingSettings(),
    ]);
    if (usersRes.data) setAdminUsers(usersRes.data);
    if (logsRes.data) setAuditLogs(logsRes.data);
    if (settingsRes.data) setPaymentSettings(settingsRes.data);
    if (shippingRes.data) setShippingSettings(shippingRes.data);
  }, [currentUser]);

  const savePaymentSettings = React.useCallback(async (input: PaymentSettings) => {
    setLoading(true);
    const res = await settingsApi.updatePaymentSettings(input);
    setLoading(false);
    if (res.error) { notify(res.error, "error"); return; }
    if (res.data) setPaymentSettings(res.data);
    notify(t("admin.toast.payment_saved"));
    void loadSuperAdminData();
  }, [t, loadSuperAdminData]);

  const saveShippingSettings = React.useCallback(async (input: ShippingSettings) => {
    setLoading(true);
    const res = await settingsApi.updateShippingSettings(input);
    setLoading(false);
    if (res.error) { notify(res.error, "error"); return; }
    if (res.data) setShippingSettings(res.data);
    notify(t("admin.toast.shipping_saved"));
    void loadSuperAdminData();
  }, [t, loadSuperAdminData]);

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
      if (ordersRes.error) notify(ordersRes.error);
    }
    if (productsRes.data) {
      setProducts(productsRes.data);
    } else if (productsRes.error) {
      notify(productsRes.error);
    }
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

    let es: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let dead = false;

    function connect() {
      if (dead) return;
      es = new EventSource("/api/backend/admin/realtime");
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as { type?: string };
          if (data.type === "orders-updated") void loadData();
          if (data.type === "super-admin-data" && currentUser?.role === "superAdmin") void loadSuperAdminData();
        } catch { void loadData(); }
      };
      es.onerror = () => {
        es?.close();
        es = null;
        if (!dead) retryTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    // Fallback polling every 30s in case SSE drops silently
    const pollInterval = setInterval(() => { void loadData(); }, 30_000);

    return () => {
      dead = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      clearInterval(pollInterval);
      es?.close();
    };
  }, [currentUser, isLoggedIn, loadData, loadSuperAdminData]);

  const pendingSlips = orders.filter((o) => o.status === "payment_review" && o.slip.status === "pending");

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
      notify(res.error, "error");
      return;
    }

    notify(`Created: ${res.data?.username ?? username}`);
    await loadSuperAdminData();
  }

  async function deleteAdminUser(username: string) {
    const res = await adminUsersApi.deleteAdminUser(username);
    if (res.error) { notify(res.error, "error"); return; }
    notify(`ลบ ${username} แล้ว`);
    await loadSuperAdminData();
  }

  async function resetAdminPassword(username: string) {
    const res = await adminUsersApi.resetAdminPassword(username);
    if (res.error) { notify(res.error, "error"); return; }
    notify(`รีเซ็ตรหัสผ่านของ ${username} แล้ว ต้องตั้งรหัสใหม่ที่ /admin/register`);
    await loadSuperAdminData();
  }

  async function callSlipApi(orderId: string, approved: boolean, note?: string) {
    setLoading(true);
    const res = await ordersApi.reviewPaymentSlip(orderId, approved, "admin", note);
    setLoading(false);
    if (res.error) {
      notify(res.error, "error");
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
      notify(res.error, "error");
    } else {
      notify(t("admin.toast.product_updated"));
      loadData();
    }
  }

  async function saveTracking(orderId: string, trackingNumber: string) {
    const res = await ordersApi.updateAdminOrder(orderId, { trackingNumber });
    if (res.error) {
      notify(res.error, "error");
    } else {
      notify("บันทึกหมายเลขพัสดุแล้ว");
      loadData();
    }
  }

  function triggerStatusConfirm(orderId: string, status: OrderStatus) {
    const order = orders.find((o) => o.id === orderId);
    setStatusConfirm({ orderId, status, isPickup: order ? isPickupOrder(order) : false });
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
      notify(res.error, "error");
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
      description: (() => {
        const th = String(formData.get("description") ?? "").trim();
        const en = String(formData.get("descriptionEn") ?? "").trim() || undefined;
        return th ? { th, en } : { th: "" };
      })(),
      price: Number(formData.get("price")) || 0,
      stock: Number(formData.get("stock")) || 0,
      discount: Number(formData.get("discount")) || undefined,
      ...(() => {
        const placement = placementByValue(String(formData.get("placement") ?? ""));
        return { category: placement?.category, group: placement?.group, charmType: placement?.charmType };
      })(),
      allowCustomName: String(formData.get("allowCustomName") ?? "") === "true",
      customNameMaxLength: Number(formData.get("customNameMaxLength")) || undefined,
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
      notify(res.error, "error");
      throw new Error(res.error);
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
      notify(res.error, "error");
      throw new Error(res.error);
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
      notify(res.error, "error");
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
    <main className="min-h-screen bg-background">
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
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-9999 max-w-sm w-[calc(100%-2rem)] backdrop-blur-md text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === "error"
            ? "bg-red-600/95 border border-red-400/20"
            : "bg-slate-900/95 border border-white/10"
        }`}>
          {toast.type === "error"
            ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-200" />
            : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          }
          <span className="leading-snug">{toast.msg}</span>
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

      <div className="md:hidden">
        <AppHeader
          showCart={false}
          showBack={false}
          showLang={false}
          logoHref="/admin"
          onLogoClick={() => setActiveTab("dashboard")}
          navItems={[
            { label: t("admin.tab.dashboard"), icon: LayoutDashboard, onClick: () => setActiveTab("dashboard") },
            { label: t("admin.tab.orders"),    icon: ClipboardList,   onClick: () => setActiveTab("orders"),   badge: pendingSlips.length },
            { label: t("admin.tab.products"),  icon: Package,         onClick: () => setActiveTab("products") },
            { label: t("admin.tab.storefront"), icon: ImageIcon,      onClick: () => setActiveTab("storefront") },
            ...(currentUser?.role === "superAdmin"
              ? [
                  { label: "จัดการหลังบ้าน", icon: LayoutDashboard, onClick: () => setActiveTab("superAdmin") } as NavItem,
                  { label: "Role Management", icon: LayoutDashboard, onClick: () => setActiveTab("adminManagement") } as NavItem,
                ]
              : []),
            { label: "Logout", icon: LogOut, onClick: handleLogout },
          ]}
        />
      </div>

      <div className="pt-14 md:pt-0 md:pl-56 lg:pl-64">
        <div className="max-w-240 mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>

            <TabsContent value="dashboard" className="mt-5 animate-in fade-in duration-200">
              <AdminStats
                orders={orders}
                pendingSlips={pendingSlips}
                setActiveTab={setActiveTab}
                onNavigateOrders={(filter) => { setOrdersFilter(filter); setActiveTab("orders"); }}
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
                onViewSlip={(images, index) => setLightbox({ images, index })}
                initialStatusFilter={ordersFilter as OrderStatus | "all" | "shipped_pickup"}
              />
            </TabsContent>

            <TabsContent value="products" className="mt-4 animate-in fade-in duration-200">
              <ProductsPanel
                products={products}
                onUpdateProduct={updateProduct}
                onDeleteProduct={deleteProduct}
                onEditProduct={setEditProduct}
                t={t}
              />
            </TabsContent>
            <TabsContent value="storefront" className="mt-4 animate-in fade-in duration-200">
              <StorefrontPanel notify={notify} />
            </TabsContent>

            {currentUser?.role === "superAdmin" ? (
              <>
                <TabsContent value="superAdmin" className="mt-4 animate-in fade-in duration-200">
                  <div className="flex flex-col gap-4">
                    <PaymentAccountPanel
                      key={paymentSettings ? "loaded" : "empty"}
                      settings={paymentSettings}
                      loading={loading}
                      onSave={savePaymentSettings}
                    />
                    <ShippingSettingsPanel
                      key={shippingSettings ? "ship-loaded" : "ship-empty"}
                      settings={shippingSettings}
                      loading={loading}
                      onSave={saveShippingSettings}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="adminManagement" className="mt-4 animate-in fade-in duration-200">
                  <SuperAdminPanel
                    adminUsers={adminUsers}
                    auditLogs={auditLogs}
                    loading={loading}
                    onCreateAccount={createAdminAccount}
                    onDeleteUser={deleteAdminUser}
                    onResetPassword={resetAdminPassword}
                    currentUsername={currentUser.username}
                  />
                </TabsContent>
              </>
            ) : null}
          </Tabs>
        </div>
      </div>

      {activeTab === "products" && (
        <button
          onClick={() => setShowAddProduct(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-brand hover:bg-brand-hover text-white rounded-full shadow-xl shadow-brand/30 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
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

function StorefrontPanel({ notify }: { notify: (msg: string) => void }) {
  const [saving, setSaving] = React.useState(false);
  const homeRef = React.useRef<(() => Promise<void>) | null>(null);

  async function handleSave() {
    if (!homeRef.current) return;
    setSaving(true);
    await homeRef.current();
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Panel content */}
      <div className="animate-in fade-in duration-200">
        <HomeContentPanel notify={notify} saveRef={homeRef} />
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 md:pl-56 lg:pl-64 z-30 bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 py-3 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-8 py-2.5 text-sm font-black transition-colors cursor-pointer"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
}
