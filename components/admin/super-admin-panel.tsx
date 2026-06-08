"use client";

import { useState } from "react";
import { KeyRound, Search, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const ACTION_LABEL: Record<string, { th: string; en: string; color: string }> = {
  "admin_user.created":        { th: "สร้างบัญชี admin",        en: "Created admin account",   color: "bg-blue-50 text-blue-700"    },
  "admin_user.registered":     { th: "ตั้งรหัสผ่านแล้ว",        en: "Password registered",      color: "bg-emerald-50 text-emerald-700"},
  "admin_user.password_reset": { th: "รีเซ็ตรหัสผ่าน",          en: "Password reset",           color: "bg-amber-50 text-amber-700"  },
  "admin_user.deleted":        { th: "ลบบัญชี admin",            en: "Deleted admin account",    color: "bg-red-50 text-red-700"      },
  "order.status_changed":      { th: "เปลี่ยนสถานะออเดอร์",      en: "Order status changed",     color: "bg-purple-50 text-purple-700"},
  "slip.approved":             { th: "อนุมัติสลิป",              en: "Slip approved",            color: "bg-emerald-50 text-emerald-700"},
  "slip.rejected":             { th: "ปฏิเสธสลิป",              en: "Slip rejected",            color: "bg-red-50 text-red-700"      },
  "product.created":           { th: "เพิ่มสินค้าใหม่",          en: "Product created",          color: "bg-blue-50 text-blue-700"    },
  "product.updated":           { th: "แก้ไขสินค้า",              en: "Product updated",          color: "bg-gray-100 text-gray-600"   },
  "product.deleted":           { th: "ลบสินค้า",                 en: "Product deleted",          color: "bg-red-50 text-red-700"      },
};

type AdminRole = "superAdmin" | "admin";

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

function metaText(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function auditDetail(log: AuditLog) {
  return [
    log.targetLabel ? `Target: ${log.targetLabel}` : "",
    metaText(log.metadata, "status") ? `Status: ${metaText(log.metadata, "status")}` : "",
    metaText(log.metadata, "reason") ? `Reason: ${metaText(log.metadata, "reason")}` : "",
    metaText(log.metadata, "note") ? `Note: ${metaText(log.metadata, "note")}` : "",
    metaText(log.metadata, "role") ? `Role: ${metaText(log.metadata, "role")}` : "",
  ].filter(Boolean).join(" | ");
}

type Props = {
  adminUsers: AdminUser[];
  auditLogs: AuditLog[];
  loading: boolean;
  onCreateAccount: (formData: FormData) => void;
  onDeleteUser: (username: string) => void;
  onResetPassword: (username: string) => void;
  currentUsername: string;
};

export function SuperAdminPanel({ adminUsers, auditLogs, loading, onCreateAccount, onDeleteUser, onResetPassword, currentUsername }: Props) {
  const [search, setSearch] = useState("");
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card className="rounded-2xl border-gray-100 shadow-xs">
        <CardContent className="p-5">
          <h2 className="text-sm font-black text-gray-900 mb-4">สร้างบัญชี Admin</h2>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => { e.preventDefault(); onCreateAccount(new FormData(e.currentTarget)); e.currentTarget.reset(); }}
          >
            <Input name="username" required placeholder="username" className="h-11 rounded-xl text-sm" />
            <div className="grid h-11 grid-cols-2 rounded-xl border border-gray-200 bg-gray-50 p-1 shadow-inner">
              <label className="group relative cursor-pointer">
                <input className="peer sr-only" type="radio" name="role" value="admin" defaultChecked />
                <span className="flex h-full items-center justify-center rounded-lg text-sm font-black text-gray-500 transition-all peer-checked:bg-white peer-checked:text-[#85241F] peer-checked:shadow-sm">Admin</span>
              </label>
              <label className="group relative cursor-pointer">
                <input className="peer sr-only" type="radio" name="role" value="superAdmin" />
                <span className="flex h-full items-center justify-center rounded-lg text-sm font-black text-gray-500 transition-all peer-checked:bg-[#85241F] peer-checked:text-white peer-checked:shadow-sm">SuperAdmin</span>
              </label>
            </div>
            <Button disabled={loading} className="h-11 w-full rounded-xl bg-[#85241F] font-black hover:bg-[#B72D2A]">
              สร้างบัญชี
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-100 shadow-xs">
        <CardContent className="p-4">
          <h2 className="mb-3 text-sm font-black text-gray-900">Admin Accounts</h2>
          <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto">
            {adminUsers.map((user) => {
              const isSelf = user.username === currentUsername;
              return (
                <div key={user.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-gray-900 truncate">{user.username}</p>
                    <p className="text-[10px] font-bold text-gray-400">{user.registered ? "registered" : "รอตั้งรหัสผ่าน"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${user.role === "superAdmin" ? "bg-[#85241F]/10 text-[#85241F]" : "bg-slate-100 text-slate-600"}`}>
                    {user.role}
                  </span>
                  {!isSelf && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => { if (confirm(`รีเซ็ตรหัสผ่านของ ${user.username}?`)) onResetPassword(user.username); }}
                        title="รีเซ็ตรหัสผ่าน"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (confirm(`ลบ ${user.username} ออกจากระบบ?`)) onDeleteUser(user.username); }}
                        title="ลบ admin"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-100 shadow-xs lg:col-span-2">
        <CardContent className="p-4">
          {/* Header + Search */}
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h2 className="text-sm font-black text-gray-900">Audit Logs</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">{auditLogs.length} รายการทั้งหมด</p>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-56 focus-within:border-[#85241F] transition-colors">
              <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อ, action..."
                className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="shrink-0 cursor-pointer">
                  <XCircle className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {(() => {
            const q = search.toLowerCase().trim();
            const filtered = q
              ? auditLogs.filter(l =>
                  l.actorUsername.toLowerCase().includes(q) ||
                  (l.actionLabel ?? l.action).toLowerCase().includes(q) ||
                  (l.targetLabel ?? "").toLowerCase().includes(q) ||
                  (ACTION_LABEL[l.action]?.th ?? "").includes(q) ||
                  (ACTION_LABEL[l.action]?.en ?? "").toLowerCase().includes(q)
                )
              : auditLogs;

            if (filtered.length === 0) return (
              <p className="py-8 text-center text-xs font-bold text-gray-400">
                {q ? `ไม่พบ "${search}"` : "ยังไม่มี log"}
              </p>
            );

            return (
              <div className="max-h-120 overflow-y-auto">
                <div className="flex flex-col">
                  {filtered.map((log, idx) => {
                    const isLast = idx === filtered.length - 1;
                    const detail = auditDetail(log);
                    const date = new Date(log.createdAt);
                    const timeStr = date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                    const dateStr = date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
                    const isSuperAdmin = log.actorRole === "superAdmin";
                    const actionMeta = ACTION_LABEL[log.action];

                    return (
                      <div key={log.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isSuperAdmin ? "bg-[#85241F]" : "bg-gray-300"}`} />
                          {!isLast && <div className="w-px flex-1 bg-gray-100 mt-1 mb-1" />}
                        </div>

                        <div className={`pb-4 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              {/* Action badge */}
                              {actionMeta ? (
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${actionMeta.color}`}>
                                    {actionMeta.th}
                                  </span>
                                  <span className="text-[9px] text-gray-400">{actionMeta.en}</span>
                                </div>
                              ) : (
                                <p className="text-xs font-black text-gray-900 mb-1">
                                  {log.actionLabel ?? log.action}
                                </p>
                              )}
                              {/* Actor */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isSuperAdmin ? "bg-[#85241F]/8 text-[#85241F]" : "bg-gray-100 text-gray-500"}`}>
                                  {log.actorUsername}
                                </span>
                                <span className="text-[9px] text-gray-400">{log.actorRole === "superAdmin" ? "Super Admin" : "Admin"}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] font-bold text-gray-700">{timeStr}</p>
                              <p className="text-[9px] text-gray-400">{dateStr}</p>
                            </div>
                          </div>
                          {detail && (
                            <p className="mt-1.5 text-[10px] font-semibold text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 leading-relaxed">
                              {detail}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
