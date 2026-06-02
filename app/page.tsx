"use client";

import Link from "next/link";
import { LayoutDashboard, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/lib/language-context";
import { LanguageChip } from "@/components/shared/language-chip";

export default function IndexPage() {
  const { t } = useLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#dcecff] px-4 py-8 relative">
      <div className="absolute top-6 right-6 z-50">
        <LanguageChip />
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
