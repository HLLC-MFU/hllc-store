"use client";

import * as React from "react";
import {
  ClipboardList,
  LayoutDashboard,
  Mail,
  Package,
  PackagePlus,
  CheckCircle2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/language-context";
import type { Order, OrderStatus, Product } from "@/components/admin/types";
import { api } from "@/components/admin/utils";
import AddProductForm from "@/components/admin/add-product-form";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AppHeader, type NavItem } from "@/components/shared/app-header";
import { EmailInput } from "@/components/shared/email-input";
import { safeParseWithLang, emailPayloadSchema } from "@/lib/schemas-i18n";

// Refactored modular components
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminStats } from "@/components/admin/admin-stats";
import { OrdersPanel } from "@/components/admin/orders-panel";
import { ProductsPanel } from "@/components/admin/products-panel";
import { ConfirmationModal } from "@/components/admin/confirmation-modal";

type AdminRole = "superAdmin" | "admin";

type CurrentAdmin = {
  username: string;
  role: AdminRole;
};

type AdminUser = {
  id: string;
  username: string;
  role: AdminRole;
  active: boolean;
  registered: boolean;
  createdAt: string;
};

type AuditLog = {
  id: string;
  actorUsername: string;
  actorRole: AdminRole;
  action: string;
  actionLabel?: string;
  metadata: Record<string, unknown>;
  targetLabel?: string;
  createdAt: string;
};

type EmailFormState = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function metaText(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function auditDetail(log: AuditLog) {
  const parts = [
    log.targetLabel ? `Target: ${log.targetLabel}` : "",
    metaText(log.metadata, "status") ? `Status: ${metaText(log.metadata, "status")}` : "",
    metaText(log.metadata, "reason") ? `Reason: ${metaText(log.metadata, "reason")}` : "",
    metaText(log.metadata, "note") ? `Note: ${metaText(log.metadata, "note")}` : "",
    metaText(log.metadata, "role") ? `Role: ${metaText(log.metadata, "role")}` : "",
  ].filter(Boolean);

  return parts.join(" | ");
}

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
  const [emailForm, setEmailForm] = React.useState<EmailFormState>({
    to: "",
    subject: "HLLC Store order update",
    text: "Hello, this is a test email from HLLC Store.",
    html: "<p>Hello, this is a <strong>test email</strong> from HLLC Store.</p>",
  });
  const [emailSending, setEmailSending] = React.useState(false);
  const { lang, t } = useLanguage();

  const [loading, setLoading] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<CurrentAdmin | null>(null);
  const [loginLoading, setLoginLoading] = React.useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  React.useEffect(() => {
    let mounted = true;

    api<{ authenticated: boolean; user: CurrentAdmin | null }>("/api/backend/admin/auth")
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

    const [usersRes, logsRes] = await Promise.all([
      api<AdminUser[]>("/api/backend/admin/users"),
      api<AuditLog[]>("/api/backend/admin/audit-logs"),
    ]);
    if (usersRes.data) setAdminUsers(usersRes.data);
    if (logsRes.data) setAuditLogs(logsRes.data);
  }, [currentUser]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    const [ordersRes, productsRes] = await Promise.all([
      api<Order[]>("/api/backend/admin/orders"),
      api<Product[]>("/api/backend/admin/products"),
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
    if (!isLoggedIn || currentUser?.role !== "superAdmin") return;

    void Promise.resolve().then(loadSuperAdminData);
    const events = new EventSource("/api/backend/admin/realtime");
    events.onmessage = () => {
      void loadSuperAdminData();
    };

    return () => events.close();
  }, [currentUser, isLoggedIn, loadSuperAdminData]);

  const pendingSlips = orders.filter((o) => o.slip.status === "pending");

  async function handleLogin(form: HTMLFormElement) {
    setLoginLoading(true);

    const fd = new FormData(form);
    const res = await api<{ authenticated: boolean; user: CurrentAdmin }>("/api/backend/admin/auth", {
      method: "POST",
      body: JSON.stringify({
        username: String(fd.get("username") ?? "").trim(),
        password: String(fd.get("password") ?? ""),
      }),
    });

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
    const res = await api<AdminUser>("/api/backend/admin/users", {
      method: "POST",
      body: JSON.stringify({ username, role }),
    });
    setLoading(false);

    if (res.error) {
      notify(res.error);
      return;
    }

    notify(`Created: ${res.data?.username ?? username}`);
    await loadSuperAdminData();
  }

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
    const nameTh = String(formData.get("name") ?? "").trim();
    if (!nameTh) return;
    setLoading(true);
    const res = await api<Product>("/api/backend/admin/products", {
      method: "POST",
      body: JSON.stringify({
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
    return <AdminLogin onLogin={handleLogin} loading={loginLoading} />;
  }

  async function sendMockEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailSending(true);

    const validation = safeParseWithLang(emailPayloadSchema("th"), emailForm, "th");
    if (!validation.success) {
      notify(validation.error ?? "อีเมลไม่ถูกต้อง");
      setEmailSending(false);
      return;
    }

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        notify(payload.message ?? "failed to send email");
        return;
      }

      notify(payload.message ?? "email sent");
    } catch (error) {
      notify(error instanceof Error ? error.message : "failed to send email");
    } finally {
      setEmailSending(false);
    }
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
      />

      <div className="lg:hidden">
        <AppHeader
          showCart={false}
          logoHref="/admin"
          navItems={[
            { label: t("admin.tab.dashboard"), icon: LayoutDashboard, onClick: () => setActiveTab("dashboard") },
            { label: t("admin.tab.orders"),    icon: ClipboardList,   onClick: () => setActiveTab("orders"),   badge: pendingSlips.length },
            { label: t("admin.tab.products"),  icon: Package,         onClick: () => setActiveTab("products") },
            { label: "Email",                  icon: Mail,            onClick: () => setActiveTab("email") },
            ...(currentUser?.role === "superAdmin"
              ? [{ label: "SuperAdmin", icon: LayoutDashboard, onClick: () => setActiveTab("superAdmin") } as NavItem]
              : []),
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
            <TabsContent value="email" className="mt-4 animate-in fade-in duration-200">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)]">
                <Card className="rounded-2xl border-gray-100 shadow-xs">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-black text-gray-900">Email Mockup</h2>
                        <p className="mt-1 text-xs font-semibold text-gray-400">Send a Gmail test message from the admin panel.</p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#85241F]/10 text-[#85241F]">
                        <Mail className="h-5 w-5" />
                      </div>
                    </div>

                    <form className="mt-5 flex flex-col gap-3" onSubmit={sendMockEmail}>
                      <label className="grid gap-1.5">
                        <span className="text-xs font-black text-gray-700">To</span>
                        <EmailInput
                          value={emailForm.to}
                          onChange={(val) => setEmailForm((form) => ({ ...form, to: val }))}
                          lang={lang}
                          placeholder="customer@example.com"
                          className="h-11 rounded-xl text-xs"
                        />
                      </label>

                      <label className="grid gap-1.5">
                        <span className="text-xs font-black text-gray-700">Subject</span>
                        <Input
                          required
                          value={emailForm.subject}
                          onChange={(event) => setEmailForm((form) => ({ ...form, subject: event.target.value }))}
                          placeholder="Subject"
                          className="h-11 rounded-xl text-xs"
                        />
                      </label>

                      <label className="grid gap-1.5">
                        <span className="text-xs font-black text-gray-700">Plain Text</span>
                        <textarea
                          value={emailForm.text}
                          onChange={(event) => setEmailForm((form) => ({ ...form, text: event.target.value }))}
                          placeholder="Email text"
                          rows={5}
                          className="min-h-28 rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-semibold text-gray-700 outline-none transition-colors placeholder:text-gray-300 focus:border-[#85241F]"
                        />
                      </label>

                      <label className="grid gap-1.5">
                        <span className="text-xs font-black text-gray-700">HTML Optional</span>
                        <textarea
                          value={emailForm.html}
                          onChange={(event) => setEmailForm((form) => ({ ...form, html: event.target.value }))}
                          placeholder="<p>Email html</p>"
                          rows={5}
                          className="min-h-28 rounded-xl border border-gray-200 bg-white px-3 py-3 font-mono text-xs text-gray-700 outline-none transition-colors placeholder:text-gray-300 focus:border-[#85241F]"
                        />
                      </label>

                      <Button
                        disabled={emailSending}
                        className="mt-2 h-11 rounded-xl bg-[#85241F] font-black hover:bg-[#B72D2A]"
                      >
                        <Send className="h-4 w-4" />
                        {emailSending ? "Sending..." : "Send Test Email"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-gray-100 shadow-xs">
                  <CardContent className="p-4">
                    <h2 className="text-sm font-black text-gray-900">Preview</h2>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white">
                      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="truncate text-xs font-black text-gray-900">{emailForm.subject || "No subject"}</p>
                        <p className="mt-1 truncate text-[10px] font-bold text-gray-400">To: {emailForm.to || "customer@example.com"}</p>
                      </div>
                      <div className="min-h-72 px-4 py-5">
                        <div className="mx-auto max-w-sm rounded-2xl border border-gray-100">
                          <div className="border-b border-gray-100 px-4 py-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/images/HLLCLOGO.png" alt="HLLC" className="h-12 w-auto object-contain" />
                          </div>
                          <div className="px-4 py-5">
                            {emailForm.html.trim() ? (
                              <div
                                className="prose prose-sm max-w-none text-sm leading-relaxed text-gray-700"
                                dangerouslySetInnerHTML={{ __html: emailForm.html }}
                              />
                            ) : (
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                                {emailForm.text || "Email body preview"}
                              </p>
                            )}
                          </div>
                          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                            <p className="text-[10px] font-bold text-gray-400">HLLC Store automated email mockup</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            {currentUser?.role === "superAdmin" ? (
              <TabsContent value="superAdmin" className="mt-4 animate-in fade-in duration-200">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                  <Card className="rounded-2xl border-gray-100 shadow-xs">
                    <CardContent className="p-4">
                      <h2 className="text-sm font-black text-gray-900">Create Admin Account</h2>
                      <form
                        className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,260px)_auto]"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void createAdminAccount(new FormData(event.currentTarget));
                          event.currentTarget.reset();
                        }}
                      >
                        <Input name="username" required placeholder="username" className="h-11 rounded-xl text-xs" />
                        <div className="grid h-11 grid-cols-2 rounded-xl border border-gray-200 bg-gray-50 p-1 shadow-inner">
                          <label className="group relative cursor-pointer">
                            <input className="peer sr-only" type="radio" name="role" value="admin" defaultChecked />
                            <span className="flex h-full items-center justify-center rounded-lg text-xs font-black text-gray-500 transition-all peer-checked:bg-white peer-checked:text-[#85241F] peer-checked:shadow-sm">
                              Admin
                            </span>
                          </label>
                          <label className="group relative cursor-pointer">
                            <input className="peer sr-only" type="radio" name="role" value="superAdmin" />
                            <span className="flex h-full items-center justify-center rounded-lg text-xs font-black text-gray-500 transition-all peer-checked:bg-[#85241F] peer-checked:text-white peer-checked:shadow-sm">
                              SuperAdmin
                            </span>
                          </label>
                        </div>
                        <Button disabled={loading} className="h-11 rounded-xl bg-[#85241F] font-black hover:bg-[#B72D2A]">
                          Create
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-gray-100 shadow-xs">
                    <CardContent className="p-4">
                      <h2 className="mb-3 text-sm font-black text-gray-900">Admin Accounts</h2>
                      <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto">
                        {adminUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                            <div>
                              <p className="text-xs font-black text-gray-900">{user.username}</p>
                              <p className="text-[10px] font-bold text-gray-400">{user.registered ? "registered" : "waiting for register"}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-black ${user.role === "superAdmin" ? "bg-[#85241F]/10 text-[#85241F]" : "bg-slate-100 text-slate-600"}`}>
                              {user.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-gray-100 shadow-xs lg:col-span-2">
                    <CardContent className="p-4">
                      <h2 className="mb-3 text-sm font-black text-gray-900">Audit Logs</h2>
                      <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="rounded-xl border border-gray-100 px-3 py-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-black text-gray-900">
                                  {log.actorUsername} <span className="text-gray-400">did</span> {log.actionLabel ?? log.action}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400">{log.actorRole}</p>
                              </div>
                              <span className="shrink-0 text-[10px] font-bold text-gray-400">
                                {new Date(log.createdAt).toLocaleString("th-TH")}
                              </span>
                            </div>
                            {auditDetail(log) ? (
                              <p className="mt-2 rounded-lg bg-gray-50 p-2 text-[10px] font-semibold text-gray-500">
                                {auditDetail(log)}
                              </p>
                            ) : null}
                          </div>
                        ))}
                        {auditLogs.length === 0 ? (
                          <p className="py-8 text-center text-xs font-bold text-gray-400">No audit logs</p>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
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
