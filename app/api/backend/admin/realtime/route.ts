import { NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/backend/admin-auth";
import { subscribeAdminRealtime } from "@/lib/backend/admin-realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function encodeEvent(event: unknown) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(request: NextRequest) {
  const authError = requireSuperAdmin(request);
  if (authError) return authError;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(encodeEvent(event)));
      };
      const unsubscribe = subscribeAdminRealtime(send);
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 30_000);

      send({ type: "connected", at: new Date().toISOString() });
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no",
    },
  });
}
