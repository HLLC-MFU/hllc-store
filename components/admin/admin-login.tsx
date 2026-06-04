"use client";

import * as React from "react";
import { Lock, User } from "lucide-react";
import { LanguageChip } from "@/components/shared/language-chip";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { safeParseWithLang, loginSchema } from "@/lib/schemas-i18n";
import type { Lang } from "@/lib/schemas-i18n";

type AdminLoginProps = {
  onLogin: (form: HTMLFormElement) => Promise<boolean>;
  loading?: boolean;
};

export function AdminLogin({ onLogin, loading = false }: AdminLoginProps) {
  const [loginError, setLoginError] = React.useState("");
  const { t, lang } = useLanguage();

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError("");
    const formData = new FormData(e.currentTarget);
    const data = {
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const result = safeParseWithLang(loginSchema(lang as Lang), data, lang as Lang);
    if (!result.success) {
      setLoginError(result.error ?? t("admin.login.error"));
      setTimeout(() => setLoginError(""), 3000);
      return;
    }

    const ok = await onLogin(e.currentTarget);
    if (!ok) {
      setLoginError(t("admin.login.error"));
      setTimeout(() => setLoginError(""), 3000);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      {/* Language chip top-right */}
      <div className="absolute top-5 right-5">
        <LanguageChip />
      </div>

      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/HLLCLOGO.png" alt="HLLC" className="h-16 w-auto object-contain mb-4" />
          <h1 className="text-xl font-black text-gray-900">{t("admin.login.title")}</h1>
          <p className="mt-1 text-xs font-semibold text-gray-400">{t("admin.login.subtitle")}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/80 p-6 flex flex-col gap-4">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                {t("admin.login.username")}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                <input
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="username"
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 text-sm font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:border-[#85241F] focus:ring-2 focus:ring-[#85241F]/10 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                {t("admin.login.password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 text-sm font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:border-[#85241F] focus:ring-2 focus:ring-[#85241F]/10 transition-all"
                />
              </div>
            </div>

            {/* Error */}
            {loginError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-bold py-2.5 px-3.5 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {loginError}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#85241F] hover:bg-[#B72D2A] text-white font-black rounded-2xl text-sm shadow-md shadow-[#85241F]/20 active:scale-[0.98] transition-all cursor-pointer mt-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {lang === "th" ? "กำลังเข้าสู่ระบบ..." : "Signing in..."}
                </span>
              ) : t("admin.login.button")}
            </Button>
          </form>

          <a
            href="/admin/register"
            className="text-center text-xs font-semibold text-gray-400 hover:text-[#85241F] transition-colors"
          >
            {lang === "th" ? "ตั้งรหัสผ่านสำหรับบัญชีใหม่" : "Set password for new account"}
          </a>
        </div>

        <p className="text-center text-[10px] font-semibold text-gray-400 mt-6">
          {t("admin.login.desc")}
        </p>
      </div>
    </main>
  );
}
