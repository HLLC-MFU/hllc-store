import { NextRequest, NextResponse } from "next/server";
import {
  sendEmail,
  slipApprovedEmail,
  slipRejectedEmail,
  trackingNumberEmail,
  pickupReadyEmail,
  orderCancelledEmail,
  type EmailPayload,
} from "@/lib/backend/email-service";
import { requireAdmin } from "@/lib/backend/admin-auth";
import { rateLimit } from "@/lib/backend/rate-limit";
import { tooManyRequests } from "@/lib/backend/http";
import { readLimitedJson } from "@/lib/backend/request-utils";

const SAMPLE_NAME = "ลูกค้าทดสอบ";
const SAMPLE_TRACKING = "TH1234567890";

function buildTestEmail(template: string, to: string, note: string): EmailPayload | null {
  switch (template) {
    case "slip_approved":
      return slipApprovedEmail(SAMPLE_NAME, to);
    case "slip_rejected":
      return slipRejectedEmail(SAMPLE_NAME, note || "ยอดเงินในสลิปไม่ตรงกับยอดคำสั่งซื้อ", to);
    case "shipped":
      return trackingNumberEmail(SAMPLE_NAME, SAMPLE_TRACKING, to);
    case "pickup_ready":
      return pickupReadyEmail(SAMPLE_NAME, to);
    case "cancelled":
      return orderCancelledEmail(SAMPLE_NAME, note || "สินค้าหมดสต็อก ขออภัยในความไม่สะดวก", to);
    default:
      return null;
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const limit = rateLimit(request, { bucket: "test-email", windowMs: 60_000, max: 10 });
  if (limit.limited) {
    return tooManyRequests(limit.retryAfterSeconds, "too many email requests");
  }

  try {
    const body = await readLimitedJson<{ to?: unknown; template?: unknown; note?: unknown }>(request, 8_000);
    const to = String(body.to ?? "").trim();
    const template = String(body.template ?? "").trim();
    const note = String(body.note ?? "").trim();

    if (!to) return NextResponse.json({ error: "กรุณากรอกอีเมลผู้รับ" }, { status: 400 });

    const payload = buildTestEmail(template, to, note);
    if (!payload) return NextResponse.json({ error: "ไม่รู้จัก template นี้" }, { status: 400 });

    await sendEmail(payload);
    return NextResponse.json({ message: "ส่งอีเมลทดสอบแล้ว" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ส่งอีเมลไม่สำเร็จ" },
      { status: 400 },
    );
  }
}
