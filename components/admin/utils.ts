import type { Order } from "./types";

export function money(v: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(v);
}

export function timeAgo(iso: string, lang: "th" | "en") {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return lang === "th" ? "เมื่อกี้" : "just now";
  if (m < 60) return lang === "th" ? `${m} นาทีที่แล้ว` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === "th" ? `${h} ชั่วโมงที่แล้ว` : `${h}h ago`;
  return lang === "th" ? `${Math.floor(h / 24)} วันที่แล้ว` : `${Math.floor(h / 24)}d ago`;
}

export function isPickupOrder(order: Order) {
  return /รับเอง|pickup|self pickup|D1/i.test(order.customer.address);
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1] ?? "";
}

export async function api<T>(path: string, init?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");

    if (init?.method && !["GET", "HEAD", "OPTIONS"].includes(init.method.toUpperCase())) {
      const csrfToken = readCookie("hllc_admin_csrf");
      if (csrfToken) {
        headers.set("x-admin-csrf", decodeURIComponent(csrfToken));
      }
    }

    const response = await fetch(path, {
      ...init,
      headers,
    });
    const payload = await response.json();
    if (!response.ok) {
      return { error: payload.error || "Request failed" };
    }
    return payload;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return { error: message };
  }
}
