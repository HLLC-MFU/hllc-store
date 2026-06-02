"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PageHeader({ title, backHref = "/home" }: {
  title: string;
  backHref?: string;
}) {
  return (
    <header className="mb-6 relative flex items-center justify-center">
      <Link
        href={backHref}
        className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <h1 className="text-2xl font-black text-gray-900">{title}</h1>
    </header>
  );
}
