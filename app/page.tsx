"use client";

import Link from "next/link";
import { LayoutDashboard, Store, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/lib/language-context";

export default function IndexPage() {
  const { lang, setLang, t } = useLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#dcecff] px-4 py-8 relative">
      {/* Floating Language Switcher */}
      <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/60 shadow-lg shadow-blue-100/40 z-50">
        <Globe className="w-3.5 h-3.5 text-blue-600 ml-1.5 shrink-0" />
        <button
          onClick={() => setLang("th")}
          className={`px-2.5 py-1 rounded-full text-[11px] font-black transition-all ${
            lang === "th"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          TH
        </button>
        <button
          onClick={() => setLang("en")}
          className={`px-2.5 py-1 rounded-full text-[11px] font-black transition-all ${
            lang === "en"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          EN
        </button>
      </div>

      <Card className="w-full max-w-md border-white/80 bg-white/90 shadow-xl shadow-blue-300/30">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-gray-900">{t("select.title")}</CardTitle>
          <CardDescription className="text-gray-500 font-medium">{t("select.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button asChild className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/10">
            <Link href="/home">
              <Store className="size-5" />
              {t("select.home")}
            </Link>
          </Button>
          <Button
            asChild
            className="h-12 rounded-2xl"
            variant="secondary"
          >
            <Link href="/admin">
              <LayoutDashboard className="size-5" />
              {t("select.admin")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
