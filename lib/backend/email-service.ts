import dotenv from "dotenv";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

dotenv.config({ path: ".env.local" });
dotenv.config();

export type EmailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

let transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;

function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function getRequiredEnv(
  name:
    | "GMAIL_USER"
    | "GMAIL_APP_PASSWORD"
    | "GMAIL_OAUTH_CLIENT_ID"
    | "GMAIL_OAUTH_CLIENT_SECRET"
    | "GMAIL_OAUTH_REFRESH_TOKEN"
    | "SMTP_HOST"
    | "SMTP_USER"
    | "SMTP_PASSWORD",
) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for email delivery.`);
  }

  return name === "GMAIL_APP_PASSWORD" || name === "SMTP_PASSWORD" ? value.replace(/\s/g, "") : value;
}

function getSenderEmail() {
  return readEnv("SMTP_FROM") || readEnv("SMTP_USER") || readEnv("GMAIL_USER");
}

function getEmailTransporter(): nodemailer.Transporter<SMTPTransport.SentMessageInfo> {
  if (transporter) return transporter;

  if (readEnv("GMAIL_OAUTH_CLIENT_ID")) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: getRequiredEnv("GMAIL_USER"),
        clientId: getRequiredEnv("GMAIL_OAUTH_CLIENT_ID"),
        clientSecret: getRequiredEnv("GMAIL_OAUTH_CLIENT_SECRET"),
        refreshToken: getRequiredEnv("GMAIL_OAUTH_REFRESH_TOKEN"),
      },
    });

    return transporter;
  }

  if (readEnv("SMTP_HOST")) {
    transporter = nodemailer.createTransport({
      host: getRequiredEnv("SMTP_HOST"),
      port: Number(readEnv("SMTP_PORT") || 587),
      secure: readEnv("SMTP_SECURE") === "true",
      auth: {
        user: getRequiredEnv("SMTP_USER"),
        pass: getRequiredEnv("SMTP_PASSWORD"),
      },
    });

    return transporter;
  }

  if (readEnv("GMAIL_USER") || readEnv("GMAIL_APP_PASSWORD")) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: getRequiredEnv("GMAIL_USER"),
        pass: getRequiredEnv("GMAIL_APP_PASSWORD"),
      },
    });

    return transporter;
  }

  throw new Error("Email provider is not configured. Set GMAIL_OAUTH_* values, SMTP_* values, or GMAIL_USER/GMAIL_APP_PASSWORD.");
}

import { emailPayloadSchema, parseOrThrow } from "@/lib/schemas";

export function validateEmailPayload(payload: EmailPayload) {
  parseOrThrow(emailPayloadSchema, payload);
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  validateEmailPayload(payload);

  await getEmailTransporter().sendMail({
    from: getSenderEmail(),
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function siteUrl() {
  return readEnv("NEXT_PUBLIC_SITE_URL") || readEnv("SITE_URL") || "http://localhost:3000";
}

function slipApprovedHtml(customerName: string, orderId: string, customerPhone?: string) {
  const orderCode = orderId.slice(-6).toUpperCase();
  const trackingUrl = `${siteUrl().replace(/\/$/, "")}/profile${customerPhone ? `?customerPhone=${encodeURIComponent(customerPhone)}` : ""}`;

  return `<div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #eeeeee;border-radius:18px;overflow:hidden;font-family:Arial,'Noto Sans Thai',sans-serif;color:#111827;">
  <div style="background:linear-gradient(135deg,#166534,#22c55e);padding:28px 24px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:.5px;">HLLC Store</h1>
    <p style="margin:8px 0 0;color:#dcfce7;font-size:14px;">Slip Approval Notification</p>
  </div>
  <div style="padding:28px 24px;text-align:center;">
    <div style="display:inline-block;background:#dcfce7;color:#166534;border-radius:999px;padding:8px 14px;font-size:13px;font-weight:bold;margin-bottom:16px;">Payment Approved</div>
    <h2 style="margin:0;color:#111827;font-size:22px;font-weight:800;">สลิปผ่านการอนุมัติแล้ว</h2>
    <p style="margin:14px 0 0;color:#4b5563;font-size:15px;line-height:1.7;">
      สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>
      ระบบ <b>HLLC Store</b> ได้ตรวจสอบสลิปการชำระเงินของคุณเรียบร้อยแล้ว<br>
      สถานะคำสั่งซื้อ <b>#${escapeHtml(orderCode)}</b> ของคุณได้รับการอนุมัติสำเร็จ
    </p>
  </div>
  <div style="padding:0 24px 24px;">
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:18px;">
      <p style="margin:0 0 10px;color:#6b7280;font-size:13px;">รายละเอียดการอนุมัติ</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;">สถานะสลิป</td>
          <td style="padding:8px 0;text-align:right;color:#16a34a;font-weight:bold;">อนุมัติแล้ว</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">ระบบ</td>
          <td style="padding:8px 0;text-align:right;color:#111827;font-weight:bold;">HLLC Store</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">ประเภท</td>
          <td style="padding:8px 0;text-align:right;color:#111827;font-weight:bold;">Payment Slip</td>
        </tr>
      </table>
    </div>
  </div>
  <div style="padding:0 24px 28px;text-align:center;">
    <a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:12px;padding:13px 24px;font-size:14px;font-weight:bold;">ดูรายละเอียดคำสั่งซื้อ / ติดตามพัสดุ</a>
  </div>
  <div style="background:#f9fafb;border-top:1px solid #eeeeee;padding:18px 24px;text-align:center;">
    <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
      อีเมลนี้ถูกส่งอัตโนมัติจากระบบ HLLC Store<br>
      กรุณาอย่าตอบกลับอีเมลฉบับนี้
    </p>
  </div>
</div>`;
}

function statusEmailHtml({
  badge,
  badgeBg,
  badgeColor,
  buttonColor,
  customerName,
  description,
  detailRows,
  headline,
  orderId,
  subtitle,
  customerPhone,
}: {
  badge: string;
  badgeBg: string;
  badgeColor: string;
  buttonColor: string;
  customerName: string;
  description: string;
  detailRows: { label: string; value: string; color?: string }[];
  headline: string;
  orderId: string;
  subtitle: string;
  customerPhone?: string;
}) {
  const orderCode = orderId.slice(-6).toUpperCase();
  const trackingUrl = `${siteUrl().replace(/\/$/, "")}/profile${customerPhone ? `?customerPhone=${encodeURIComponent(customerPhone)}` : ""}`;
  const rows = detailRows
    .map((row) => `<tr>
          <td style="padding:8px 0;color:#6b7280;">${escapeHtml(row.label)}</td>
          <td style="padding:8px 0;text-align:right;color:${row.color ?? "#111827"};font-weight:bold;">${escapeHtml(row.value)}</td>
        </tr>`)
    .join("");

  return `<div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #eeeeee;border-radius:18px;overflow:hidden;font-family:Arial,'Noto Sans Thai',sans-serif;color:#111827;">
  <div style="background:linear-gradient(135deg,#111827,#374151);padding:28px 24px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:.5px;">HLLC Store</h1>
    <p style="margin:8px 0 0;color:#e5e7eb;font-size:14px;">${escapeHtml(subtitle)}</p>
  </div>
  <div style="padding:28px 24px;text-align:center;">
    <div style="display:inline-block;background:${badgeBg};color:${badgeColor};border-radius:999px;padding:8px 14px;font-size:13px;font-weight:bold;margin-bottom:16px;">${escapeHtml(badge)}</div>
    <h2 style="margin:0;color:#111827;font-size:22px;font-weight:800;">${escapeHtml(headline)}</h2>
    <p style="margin:14px 0 0;color:#4b5563;font-size:15px;line-height:1.7;">
      สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>
      ${description}<br>
      หมายเลขคำสั่งซื้อ <b>#${escapeHtml(orderCode)}</b>
    </p>
  </div>
  <div style="padding:0 24px 24px;">
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:18px;">
      <p style="margin:0 0 10px;color:#6b7280;font-size:13px;">รายละเอียด</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
    </div>
  </div>
  <div style="padding:0 24px 28px;text-align:center;">
    <a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:${buttonColor};color:#ffffff;text-decoration:none;border-radius:12px;padding:13px 24px;font-size:14px;font-weight:bold;">ดูรายละเอียดคำสั่งซื้อ / ติดตามพัสดุ</a>
  </div>
  <div style="background:#f9fafb;border-top:1px solid #eeeeee;padding:18px 24px;text-align:center;">
    <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
      อีเมลนี้ถูกส่งอัตโนมัติจากระบบ HLLC Store<br>
      กรุณาอย่าตอบกลับอีเมลฉบับนี้
    </p>
  </div>
</div>`;
}

export function slipApprovedEmail(customerName: string, orderId: string, to = "", customerPhone?: string): EmailPayload {
  return {
    to,
    subject: "HLLC Store - สลิปผ่านการอนุมัติแล้ว",
    text: `Hello ${customerName}, your payment slip for order #${orderId.slice(-6).toUpperCase()} has been approved.`,
    html: slipApprovedHtml(customerName, orderId, customerPhone),
  };
}

export function slipRejectedEmail(customerName: string, orderId: string, note?: string, to = "", customerPhone?: string): EmailPayload {
  return {
    to,
    subject: "HLLC Store - กรุณาส่งสลิปใหม่",
    text: `Hello ${customerName}, your payment slip for order #${orderId.slice(-6).toUpperCase()} was not approved.${note ? ` Reason: ${note}` : ""} Please upload a new payment slip.`,
    html: statusEmailHtml({
      badge: "Payment Rejected",
      badgeBg: "#fee2e2",
      badgeColor: "#b91c1c",
      buttonColor: "#dc2626",
      customerName,
      description: `ระบบ <b>HLLC Store</b> ตรวจสอบสลิปแล้วไม่ผ่าน กรุณาอัปโหลดสลิปใหม่อีกครั้ง${note ? `<br>เหตุผล: <b>${escapeHtml(note)}</b>` : ""}`,
      detailRows: [
        { label: "สถานะสลิป", value: "ไม่ผ่านการตรวจสอบ", color: "#dc2626" },
        { label: "ประเภท", value: "Payment Slip" },
        ...(note ? [{ label: "เหตุผล", value: note }] : []),
      ],
      headline: "สลิปไม่ผ่านการอนุมัติ",
      orderId,
      subtitle: "Slip Rejection Notification",
      customerPhone,
    }),
  };
}

export function trackingNumberEmail(
  customerName: string,
  orderId: string,
  trackingNumber: string,
  to = "",
  customerPhone?: string,
): EmailPayload {
  return {
    to,
    subject: "HLLC Store - จัดส่งสินค้าแล้ว",
    text: `Hello ${customerName}, your order #${orderId.slice(-6).toUpperCase()} has been shipped. Tracking number: ${trackingNumber}`,
    html: statusEmailHtml({
      badge: "Order Shipped",
      badgeBg: "#dbeafe",
      badgeColor: "#1d4ed8",
      buttonColor: "#2563eb",
      customerName,
      description: `ระบบ <b>HLLC Store</b> ได้จัดส่งคำสั่งซื้อของคุณแล้ว`,
      detailRows: [
        { label: "สถานะ", value: "จัดส่งแล้ว", color: "#2563eb" },
        { label: "เลขพัสดุ", value: trackingNumber },
        { label: "ประเภท", value: "Shipping" },
      ],
      headline: "จัดส่งสินค้าแล้ว",
      orderId,
      subtitle: "Shipping Tracking Notification",
      customerPhone,
    }),
  };
}

export function slipResetEmail(customerName: string, orderId: string, note?: string, to = "", customerPhone?: string): EmailPayload {
  const orderCode = orderId.slice(-6).toUpperCase();
  const reason = note?.trim() || "ทีมงานไม่สามารถตรวจสอบรายละเอียดในสลิปเดิมได้ครบถ้วน";

  return {
    to,
    subject: "HLLC Store - กรุณาอัปโหลดสลิปใหม่",
    text: `สวัสดีคุณ ${customerName}, สลิปชำระเงินของคำสั่งซื้อ #${orderCode} ต้องตรวจสอบใหม่ เนื่องจาก${reason} กรุณาอัปโหลดสลิปใหม่อีกครั้งผ่านหน้าติดตามคำสั่งซื้อ`,
    html: statusEmailHtml({
      badge: "Slip Needs Review",
      badgeBg: "#fef3c7",
      badgeColor: "#92400e",
      buttonColor: "#85241F",
      customerName,
      description: `สลิปชำระเงินของคุณยังตรวจสอบไม่สำเร็จ เนื่องจาก <b>${escapeHtml(reason)}</b> กรุณาอัปโหลดสลิปใหม่อีกครั้งเพื่อให้ทีมงานดำเนินการต่อ`,
      detailRows: [
        { label: "สถานะสลิป", value: "รออัปโหลดสลิปใหม่", color: "#92400e" },
        { label: "เหตุผล", value: reason },
        { label: "ประเภท", value: "Payment Slip" },
      ],
      headline: "สลิปชำระเงินต้องตรวจสอบใหม่",
      orderId,
      subtitle: "Payment Slip Review Notice",
      customerPhone,
    }),
  };
}

export function orderCancelledEmail(customerName: string, orderId: string, reason: string, to = ""): EmailPayload {
  return {
    to,
    subject: "Order cancelled",
    text: `Hello ${customerName}, order #${orderId.slice(-6).toUpperCase()} was cancelled. Reason: ${reason}`,
  };
}
