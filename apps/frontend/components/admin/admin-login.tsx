"use client";

import * as React from "react";
import Image from "next/image";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/client/language-context";
import { appPath } from "@/lib/client/app-path";
import { safeParseWithLang, loginSchema } from "@hllc/shared/validation/schemas-i18n";
import type { Lang } from "@hllc/shared/validation/schemas-i18n";

type AdminLoginProps = {
  onLogin: (form: HTMLFormElement) => Promise<boolean>;
  loading?: boolean;
};

export function AdminLogin({ onLogin, loading = false }: AdminLoginProps) {
  const [loginError, setLoginError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
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
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
<div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image src={appPath("/images/HLLCLOGO.png")} alt="HLLC" width={240} height={64} className="h-16 w-auto object-contain mb-4" priority />
          <h1 className="text-xl font-black text-gray-900">{t("admin.login.title")}</h1>
          <p className="mt-1 text-xs font-semibold text-gray-400">{t("admin.login.subtitle")}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/80 p-6 flex flex-col gap-4">
          <form onSubmit={handleLogin} method="post" className="flex flex-col gap-4">

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
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 text-sm font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
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
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-10 text-sm font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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
              className="w-full h-12 bg-brand hover:bg-brand-hover text-white font-black rounded-2xl text-sm shadow-md shadow-brand/20 active:scale-[0.98] transition-all cursor-pointer mt-1"
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
            href={appdPath("/admin/register")}
            className="flex items-center justify-center h-12 w-full rounded-2xl border-2 border-brand text-brand text-sm font-black hover:bg-brand/5 transition-colors"
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
