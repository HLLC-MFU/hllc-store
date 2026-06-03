"use client";

import Link from "next/link";
import { useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminRegisterPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setMessage("รหัสผ่านไม่ตรงกัน");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/backend/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: String(formData.get("username") ?? "").trim(),
        password,
      }),
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error || "สมัครไม่สำเร็จ");
      return;
    }

    setMessage("ตั้งรหัสผ่านสำเร็จ กลับไปเข้าสู่ระบบได้เลย");
    event.currentTarget.reset();
  }

  return (
    <main className="min-h-screen bg-[#111827] px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#85241F] shadow-lg shadow-[#85241F]/35">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-black">Register Admin User</h1>
          <p className="mt-2 text-xs font-semibold text-white/50">
            ใช้ username ที่ superAdmin สร้างไว้ แล้วตั้งรหัสผ่านของคุณเอง
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input name="username" required placeholder="username" className="h-11 rounded-2xl bg-white text-gray-900" />
          <Input name="password" required type="password" minLength={8} placeholder="password อย่างน้อย 8 ตัว" className="h-11 rounded-2xl bg-white text-gray-900" />
          <Input name="confirmPassword" required type="password" minLength={8} placeholder="ยืนยัน password" className="h-11 rounded-2xl bg-white text-gray-900" />
          {message ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-bold text-white/80">
              {message}
            </div>
          ) : null}
          <Button disabled={loading} className="h-11 rounded-2xl bg-[#85241F] font-black hover:bg-[#B72D2A]">
            {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่าน"}
          </Button>
        </form>

        <Link href="/admin" className="text-center text-xs font-bold text-white/50 hover:text-white">
          กลับไปหน้า Login
        </Link>
      </div>
    </main>
  );
}
