import { type NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const upstream = await fetch(`${BACKEND_URL}/api/backend/admin/realtime`, {
    headers: {
      accept: "text/event-stream",
      cache: "no-store",
      cookie: req.headers.get("cookie") ?? "",
    },
  }).catch(() => null);

  if (!upstream?.ok || !upstream.body) {
    return new Response("Upstream error", { status: upstream?.status ?? 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Accel-Buffering": "no",
    },
  });
}
