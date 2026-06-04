"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock, User, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { safeParseWithLang, registerSchema } from "@/lib/validation/schemas-i18n";

export default function AdminRegisterPage() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const data = {
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    const result = safeParseWithLang(registerSchema("th"), data, "th");
    if (!result.success || !result.data) {
      setMessage(result.error ?? "ข้อมูลไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/backend/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: result.data.username.trim(),
        password: result.data.password,
      }),
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error || "สมัครไม่สำเร็จ");
      return;
    }

    setSuccess(true);
    setMessage("ตั้งรหัสผ่านสำเร็จแล้ว");
    event.currentTarget.reset();
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/HLLCLOGO.png" alt="HLLC" className="h-16 w-auto object-contain mb-4" />
          <h1 className="text-xl font-black text-gray-900">ตั้งรหัสผ่าน</h1>
          <p className="mt-1 text-xs font-semibold text-gray-400 text-center">
            ใช้ username ที่ superAdmin สร้างไว้ แล้วตั้งรหัสผ่านของคุณเอง
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/80 p-6 flex flex-col gap-4">
          <form onSubmit={submit} className="flex flex-col gap-4">

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                <input
                  name="username"
                  required
                  placeholder="username"
                  autoComplete="username"
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 text-sm font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:border-[#85241F] focus:ring-2 focus:ring-[#85241F]/10 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                <input
                  name="password"
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  autoComplete="new-password"
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-10 text-sm font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:border-[#85241F] focus:ring-2 focus:ring-[#85241F]/10 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider">ยืนยัน Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                <input
                  name="confirmPassword"
                  required
                  type={showConfirm ? "text" : "password"}
                  minLength={8}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-10 text-sm font-semibold text-gray-900 placeholder:text-gray-300 outline-none focus:border-[#85241F] focus:ring-2 focus:ring-[#85241F]/10 transition-all"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`flex items-center gap-2 text-xs font-bold py-2.5 px-3.5 rounded-xl border ${
                success
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                  : "bg-red-50 border-red-100 text-red-600"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${success ? "bg-emerald-500" : "bg-red-500"}`} />
                {message}
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
                  กำลังบันทึก...
                </span>
              ) : "ตั้งรหัสผ่าน"}
            </Button>
          </form>

          <Link
            href="/admin"
            className="text-center text-xs font-semibold text-gray-400 hover:text-[#85241F] transition-colors"
          >
            กลับไปหน้า Login
          </Link>
        </div>

        <p className="text-center text-[10px] font-semibold text-gray-400 mt-6">
          HLLC Store · Admin Portal
        </p>
      </div>
    </main>
  );
}
