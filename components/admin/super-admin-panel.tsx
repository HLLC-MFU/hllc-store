"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

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
};

export function SuperAdminPanel({ adminUsers, auditLogs, loading, onCreateAccount }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card className="rounded-2xl border-gray-100 shadow-xs">
        <CardContent className="p-4">
          <h2 className="text-sm font-black text-gray-900">Create Admin Account</h2>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,260px)_auto]"
            onSubmit={(e) => { e.preventDefault(); onCreateAccount(new FormData(e.currentTarget)); e.currentTarget.reset(); }}
          >
            <Input name="username" required placeholder="username" className="h-11 rounded-xl text-xs" />
            <div className="grid h-11 grid-cols-2 rounded-xl border border-gray-200 bg-gray-50 p-1 shadow-inner">
              <label className="group relative cursor-pointer">
                <input className="peer sr-only" type="radio" name="role" value="admin" defaultChecked />
                <span className="flex h-full items-center justify-center rounded-lg text-xs font-black text-gray-500 transition-all peer-checked:bg-white peer-checked:text-[#85241F] peer-checked:shadow-sm">Admin</span>
              </label>
              <label className="group relative cursor-pointer">
                <input className="peer sr-only" type="radio" name="role" value="superAdmin" />
                <span className="flex h-full items-center justify-center rounded-lg text-xs font-black text-gray-500 transition-all peer-checked:bg-[#85241F] peer-checked:text-white peer-checked:shadow-sm">SuperAdmin</span>
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
                {auditDetail(log) && (
                  <p className="mt-2 rounded-lg bg-gray-50 p-2 text-[10px] font-semibold text-gray-500">
                    {auditDetail(log)}
                  </p>
                )}
              </div>
            ))}
            {auditLogs.length === 0 && (
              <p className="py-8 text-center text-xs font-bold text-gray-400">No audit logs</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
