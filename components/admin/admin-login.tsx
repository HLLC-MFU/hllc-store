"use client";

import * as React from "react";
import { Package } from "lucide-react";
import { LanguageChip } from "@/components/shared/language-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/language-context";

type AdminLoginProps = {
  onLoginSuccess: () => void;
};

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [loginError, setLoginError] = React.useState("");
  const { t } = useLanguage();

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username")).trim();
    const password = String(fd.get("password")).trim();

    if (username === "admin" && password === "password") {
      sessionStorage.setItem("admin-logged-in", "true");
      onLoginSuccess();
    } else {
      setLoginError(t("admin.login.error"));
      setTimeout(() => setLoginError(""), 3000);
    }
  };

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
        <div className="absolute top-4 right-4">
          <LanguageChip />
        </div>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-[#85241F] to-[#b8332b] flex items-center justify-center shadow-lg shadow-[#85241F]/35 mb-4 animate-pulse">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none block">{t("admin.login.title")}</h1>
          <p className="text-[10px] text-white/55 mt-2 leading-relaxed max-w-xs block">{t("admin.login.subtitle")}</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-2">
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
