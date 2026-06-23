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

import { emailPayloadSchema, parseOrThrow } from "@hllc/shared/validation/schemas";

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

// ── Shared base template ─────────────────────────────────────────────────────
function trackingUrl(customerPhone?: string) {
  return `${siteUrl().replace(/\/$/, "")}/track-order${customerPhone ? `?customerPhone=${encodeURIComponent(customerPhone)}` : ""}`;
}

const CTA_LABEL = "ดูคำสั่งซื้อ / ติดตามสถานะ";

type BaseEmailOptions = {
  badge: string;
  badgeBg: string;
  badgeColor: string;
  alert: string;
  icon: "check" | "alert" | "arrow" | "target" | "x";
  headline: string;
  /** HTML allowed — escape dynamic parts at the call site. */
  intro: string;
  detailRows: { label: string; value: string; color?: string }[];
  note?: { label: string; text: string };
  customerPhone?: string;
};

function baseEmailHtml(opts: BaseEmailOptions) {
  const rows = opts.detailRows
    .map((row) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;border-collapse:separate;border-spacing:0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
        <tr>
          <td style="padding:11px 13px;color:#6b7280;font-size:12px;font-weight:700;line-height:1.4;">${escapeHtml(row.label)}</td>
          <td align="right" style="padding:11px 13px;color:${row.color ?? "#111827"};font-size:13px;font-weight:800;line-height:1.4;">${escapeHtml(row.value)}</td>
        </tr>
      </table>`)
    .join("");

  const noteBlock = opts.note
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e5e7eb;border-left:4px solid #a52a25;border-radius:10px;">
        <tr>
          <td style="padding:13px 15px;">
            <div style="color:#8f2924;font-size:12px;font-weight:800;line-height:1.45;">${escapeHtml(opts.note.label)}</div>
            <div style="margin-top:6px;color:#4b5563;font-size:13px;font-weight:700;line-height:1.55;white-space:pre-line;">${escapeHtml(opts.note.text)}</div>
          </td>
        </tr>
      </table>`
    : "";

  const iconGlyph = {
    check: "&#10003;",
    alert: "!",
    arrow: "&#8599;",
    target: "&#9678;",
    x: "&#215;",
  }[opts.icon];

  return `<div style="margin:0;padding:8px 4px;background:#f3f4f6;font-family:Arial,'Noto Sans Thai',sans-serif;color:#111827;">
  <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
    <tr>
      <td style="padding:18px 14px;border-bottom:1px solid #e5e7eb;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="vertical-align:middle;">
              <span style="color:#8b2420;font-size:22px;font-weight:800;letter-spacing:3px;line-height:1;white-space:nowrap;">HLLC</span>
              <span style="color:#6b7280;font-size:10px;font-weight:700;letter-spacing:2px;line-height:1;padding-left:6px;white-space:nowrap;">ONLINE STORE</span>
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="display:inline-block;background:${opts.badgeBg};color:${opts.badgeColor};border-radius:999px;padding:7px 11px;font-size:11px;font-weight:800;line-height:1.2;white-space:nowrap;">${escapeHtml(opts.badge)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 14px 22px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:separate;border-spacing:0;background:${opts.badgeBg};border-radius:12px;">
          <tr>
            <td width="48" align="center" style="padding:14px 0 14px 12px;">
              <span style="display:inline-block;width:36px;height:36px;border-radius:999px;background:${opts.badgeColor};color:#ffffff;font-family:Arial,sans-serif;font-size:22px;font-weight:800;line-height:36px;text-align:center;">${iconGlyph}</span>
            </td>
            <td style="padding:14px 13px;color:${opts.badgeColor};font-size:14px;font-weight:800;line-height:1.45;">${escapeHtml(opts.alert)}</td>
          </tr>
        </table>
        <h1 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:800;line-height:1.35;">${escapeHtml(opts.headline)}</h1>
        <div style="margin:0 0 18px;color:#4b5563;font-size:14px;font-weight:500;line-height:1.6;">${opts.intro}</div>
        <div style="margin:0 0 8px;">${rows}</div>
        ${noteBlock}
        <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:20px auto 26px;border-collapse:collapse;">
          <tr>
            <td align="center" bgcolor="#a52a25" style="border-radius:8px;">
              <a href="${escapeHtml(trackingUrl(opts.customerPhone))}" style="display:inline-block;padding:11px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;line-height:1.25;">${CTA_LABEL}</a>
            </td>
          </tr>
        </table>
        <div style="border-top:1px solid #e5e7eb;padding-top:16px;text-align:center;color:#9ca3af;font-size:11px;font-weight:700;line-height:1.55;">
          อีเมลฉบับนี้ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ<br>
          © HLLC Store
        </div>
      </td>
    </tr>
  </table>
</div>`;
}

// ── Email templates ──────────────────────────────────────────────────────────
export function slipApprovedEmail(customerName: string, to = "", customerPhone?: string): EmailPayload {
  return {
    to,
    subject: "HLLC Store - สลิปผ่านการอนุมัติแล้ว",
    text: `สวัสดีคุณ ${customerName}, สลิปการชำระเงินของคุณผ่านการอนุมัติแล้ว เรากำลังเตรียมจัดส่งสินค้าให้คุณ`,
    html: baseEmailHtml({
      badge: "ชำระเงินสำเร็จ",
      badgeBg: "#dcfce7",
      badgeColor: "#166534",
      alert: "เราได้รับการชำระเงินของคุณเรียบร้อยแล้ว",
      icon: "check",
      headline: "ยืนยันการชำระเงินเรียบร้อย",
      intro: `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>เราได้รับการชำระเงินของคุณแล้ว ทางร้านกำลังเตรียมจัดส่งสินค้าให้โดยเร็วที่สุด`,
      detailRows: [
        { label: "สถานะ", value: "ชำระเงินสำเร็จ", color: "#166534" },
      ],
      customerPhone,
    }),
  };
}

export function slipRejectedEmail(customerName: string, note?: string, to = "", customerPhone?: string): EmailPayload {
  const message = note?.trim();
  return {
    to,
    subject: "HLLC Store - กรุณาส่งสลิปใหม่",
    text: `สวัสดีคุณ ${customerName}, สลิปการชำระเงินของคุณไม่ผ่านการตรวจสอบ${message ? ` (${message})` : ""} กรุณาอัปโหลดสลิปใหม่อีกครั้ง`,
    html: baseEmailHtml({
      badge: "สลิปไม่ผ่าน",
      badgeBg: "#fee2e2",
      badgeColor: "#b91c1c",
      alert: "เรายืนยันการชำระเงินจากสลิปไม่สำเร็จ",
      icon: "alert",
      headline: "ตรวจสอบสลิปไม่สำเร็จ",
      intro: `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>ขออภัย เราไม่สามารถยืนยันการชำระเงินจากสลิปที่คุณส่งมาได้ รบกวนตรวจสอบและส่งใหม่อีกครั้ง`,
      detailRows: [
        { label: "สถานะสลิป", value: "ไม่ผ่านการตรวจสอบ", color: "#b91c1c" },
      ],
      note: message ? { label: "ข้อความจากร้าน", text: message } : undefined,
      customerPhone,
    }),
  };
}

export function trackingNumberEmail(
  customerName: string,
  trackingNumber: string,
  to = "",
  customerPhone?: string,
): EmailPayload {
  return {
    to,
    subject: "HLLC Store - จัดส่งสินค้าแล้ว",
    text: `สวัสดีคุณ ${customerName}, คำสั่งซื้อของคุณถูกจัดส่งแล้ว เลขพัสดุ: ${trackingNumber}`,
    html: baseEmailHtml({
      badge: "จัดส่งแล้ว",
      badgeBg: "#dbeafe",
      badgeColor: "#1d4ed8",
      alert: "พัสดุออกจากคลังแล้ว กำลังเดินทางถึงคุณ",
      icon: "arrow",
      headline: "พัสดุของคุณกำลังเดินทาง",
      intro: `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>คำสั่งซื้อของคุณถูกจัดส่งเรียบร้อยแล้ว ติดตามสถานะพัสดุได้จากปุ่มด้านล่าง`,
      detailRows: [
        { label: "สถานะ", value: "จัดส่งแล้ว", color: "#1d4ed8" },
        { label: "เลขพัสดุ", value: trackingNumber },
      ],
      customerPhone,
    }),
  };
}

export function pickupReadyEmail(
  customerName: string,
  to = "",
  customerPhone?: string,
  location?: string,
  pickupHours?: string,
): EmailPayload {
  return {
    to,
    subject: "HLLC Store - สินค้าพร้อมให้รับแล้ว",
    text: `สวัสดีคุณ ${customerName}, คำสั่งซื้อของคุณพร้อมให้มารับแล้ว${location ? `ที่ ${location}` : ""}${pickupHours ? ` เวลา ${pickupHours}` : ""}`,
    html: baseEmailHtml({
      badge: "พร้อมให้รับ",
      badgeBg: "#fef3c7",
      badgeColor: "#92400e",
      alert: "สินค้าของคุณพร้อมให้เข้ารับที่ร้านแล้ว",
      icon: "target",
      headline: "สินค้าพร้อมให้เข้ารับแล้ว",
      intro: `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>คำสั่งซื้อของคุณพร้อมให้เข้ารับแล้ว กรุณาแสดงเบอร์โทรที่ใช้สั่งซื้อกับเจ้าหน้าที่เมื่อมาถึง`,
      detailRows: [
        { label: "สถานะ", value: "พร้อมให้รับ", color: "#92400e" },
        ...(location ? [{ label: "จุดรับสินค้า", value: location }] : []),
        ...(pickupHours ? [{ label: "เวลารับสินค้า", value: pickupHours }] : []),
      ],
      customerPhone,
    }),
  };
}

function formatItemValue(i: { name: string; option?: string; customName?: string }): string {
  let base = i.option ? `${i.name} (${i.option})` : i.name;
  if (i.customName?.startsWith("charm:")) {
    const parts = i.customName.slice(6).split(":");
    const color = parts[0] ?? "";
    const letters = parts[1] ?? "";
    base += ` + สายห้อย สี${color}`;
    if (letters) base += ` · ${letters}`;
  }
  return base;
}

export function orderConfirmedEmail(
  customerName: string,
  to = "",
  opts: {
    items: { name: string; qty: number; option?: string; customName?: string }[];
    deliveryMode: "delivery" | "pickup";
    customerPhone?: string;
    pickupLocation?: string;
  },
): EmailPayload {
  const deliveryLabel = opts.deliveryMode === "pickup"
    ? (opts.pickupLocation ? `รับที่ ${opts.pickupLocation}` : "รับที่ร้าน")
    : "จัดส่งพัสดุ";
  const itemRows = opts.items.map((i) => ({
    label: `${i.qty}×`,
    value: formatItemValue(i),
  }));
  return {
    to,
    subject: "HLLC Store - รับคำสั่งซื้อเรียบร้อยแล้ว",
    text: `สวัสดีคุณ ${customerName}, เราได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว: ${opts.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}`,
    html: baseEmailHtml({
      badge: "รับคำสั่งซื้อแล้ว",
      badgeBg: "#ede9fe",
      badgeColor: "#5b21b6",
      alert: "เราได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว",
      icon: "check",
      headline: "ขอบคุณที่สั่งซื้อกับเรา!",
      intro: `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>คำสั่งซื้อของคุณถูกบันทึกเรียบร้อยแล้ว`,
      detailRows: [
        ...itemRows,
        { label: "วิธีรับสินค้า", value: deliveryLabel },
        { label: "สถานะ", value: "รอตรวจสอบการชำระเงิน", color: "#92400e" },
      ],
      customerPhone: opts.customerPhone,
    }),
  };
}

export function slipReceivedEmail(customerName: string, to = "", customerPhone?: string): EmailPayload {
  return {
    to,
    subject: "HLLC Store - ได้รับสลิปของคุณแล้ว",
    text: `สวัสดีคุณ ${customerName}, เราได้รับสลิปการชำระเงินของคุณแล้ว กำลังตรวจสอบและจะแจ้งผลให้ทราบโดยเร็ว`,
    html: baseEmailHtml({
      badge: "รอตรวจสลิป",
      badgeBg: "#fef3c7",
      badgeColor: "#92400e",
      alert: "เราได้รับสลิปของคุณแล้ว กำลังตรวจสอบ",
      icon: "target",
      headline: "ได้รับสลิปเรียบร้อยแล้ว",
      intro: `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>เราได้รับสลิปการชำระเงินของคุณแล้ว ทีมงานกำลังตรวจสอบและจะแจ้งผลให้ทราบทางอีเมลนี้โดยเร็วที่สุด`,
      detailRows: [
        { label: "สถานะสลิป", value: "รอตรวจสอบ", color: "#92400e" },
      ],
      customerPhone,
    }),
  };
}

export function orderCancelledEmail(customerName: string, reason: string, to = "", customerPhone?: string): EmailPayload {
  const message = reason?.trim();
  return {
    to,
    subject: "HLLC Store - คำสั่งซื้อถูกยกเลิก",
    text: `สวัสดีคุณ ${customerName}, คำสั่งซื้อของคุณถูกยกเลิกแล้ว${message ? ` เหตุผล: ${message}` : ""}`,
    html: baseEmailHtml({
      badge: "ยกเลิกแล้ว",
      badgeBg: "#fee2e2",
      badgeColor: "#b91c1c",
      alert: "คำสั่งซื้อนี้ถูกยกเลิกเรียบร้อยแล้ว",
      icon: "x",
      headline: "คำสั่งซื้อถูกยกเลิก",
      intro: `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>คำสั่งซื้อของคุณได้ถูกยกเลิกแล้ว หากมีการชำระเงินเข้ามา ทางร้านได้ดำเนินการคืนเงินเต็มจำนวน`,
      detailRows: [
        { label: "สถานะ", value: "ยกเลิกแล้ว", color: "#b91c1c" },
      ],
      note: message ? { label: "เหตุผลการยกเลิก", text: message } : undefined,
      customerPhone,
    }),
  };
}
