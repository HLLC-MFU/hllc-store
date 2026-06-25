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

type BaseEmailOptions = {
  badge: string;
  badgeBg: string;
  badgeColor: string;
  alert: string;
  icon: "check" | "alert" | "arrow" | "target" | "x" | "clock" | "star";
  headline: string;
  /** HTML allowed — escape dynamic parts at the call site. */
  intro: string;
  detailRows: { label: string; value: string; color?: string; href?: string }[];
  note?: { label: string; text: string };
  customerPhone?: string;
  ctaLabel?: string;
  footerText?: string;
};

function baseEmailHtml(opts: BaseEmailOptions) {
  const rows = opts.detailRows
    .map((row) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;border-collapse:separate;border-spacing:0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
        <tr>
          <td style="padding:11px 13px;color:#6b7280;font-size:12px;font-weight:700;line-height:1.4;">${escapeHtml(row.label)}</td>
          <td align="right" style="padding:11px 13px;color:${row.color ?? "#111827"};font-size:13px;font-weight:800;line-height:1.4;">${row.href ? `<a href="${escapeHtml(row.href)}" style="color:${row.color ?? "#1d4ed8"};text-decoration:underline;">${escapeHtml(row.value)}</a>` : escapeHtml(row.value)}</td>
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
    arrow: "&#9658;",
    target: "&#9679;",
    x: "&#215;",
    clock: "&#9783;",
    star: "&#9733;",
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
              <a href="${escapeHtml(trackingUrl(opts.customerPhone))}" style="display:inline-block;padding:11px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;line-height:1.25;">${opts.ctaLabel ?? "ดูคำสั่งซื้อ / ติดตามสถานะ"}</a>
            </td>
          </tr>
        </table>
        <div style="border-top:1px solid #e5e7eb;padding-top:16px;text-align:center;color:#9ca3af;font-size:11px;font-weight:700;line-height:1.55;">
          ${opts.footerText ?? "อีเมลฉบับนี้ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ"}<br>
          © HLLC Store
        </div>
      </td>
    </tr>
  </table>
</div>`;
}

// ── Email templates ──────────────────────────────────────────────────────────
export function slipApprovedEmail(customerName: string, to = "", customerPhone?: string, lang: "th" | "en" = "th"): EmailPayload {
  const en = lang === "en";
  return {
    to,
    subject: en ? "HLLC Store – Payment Completed" : "HLLC Store - ยืนยันการชำระเงินเรียบร้อยแล้ว",
    text: en
      ? `Hi ${customerName}, Your payment has been verified. We're preparing your order now.`
      : `สวัสดีคุณ ${customerName}, หลักฐานการชำระเงินของคุณผ่านการตรวจสอบแล้ว เรากำลังเตรียมจัดส่งสินค้าให้คุณ`,
    html: baseEmailHtml({
      badge: en ? "Payment Confirmed" : "ชำระเงินสำเร็จ",
      badgeBg: "#dcfce7",
      badgeColor: "#166534",
      alert: en ? "Your payment has been confirmed" : "เราได้รับการชำระเงินของคุณเรียบร้อยแล้ว",
      icon: "check",
      headline: en ? "Payment Confirmed" : "ยืนยันการชำระเงินเรียบร้อย",
      intro: en
        ? `Hi <b>${escapeHtml(customerName)}</b><br>Your payment has been verified. We're preparing your order now.`
        : `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>เราได้รับการชำระเงินของคุณแล้ว ทางร้านกำลังเตรียมจัดส่งสินค้า`,
      detailRows: [
        { label: en ? "Status" : "สถานะ", value: en ? "Payment Confirmed" : "ชำระเงินสำเร็จ", color: "#166534" },
      ],
      customerPhone,
      ctaLabel: en ? "View order / Track status" : undefined,
      footerText: en ? "This is an automated email — please do not reply." : undefined,
    }),
  };
}

export function slipRejectedEmail(customerName: string, note?: string, to = "", customerPhone?: string, lang: "th" | "en" = "th"): EmailPayload {
  const message = note?.trim();
  const en = lang === "en";
  return {
    to,
    subject: en ? "HLLC Store – Payment issue" : "HLLC Store - หลักฐานการชำระเงินไม่ถูกต้อง",
    text: en
      ? `Hi ${customerName}, We couldn't verify your proof of payment. Please upload a clearer image and try again.`
      : `สวัสดีคุณ ${customerName}, ขออภัย เราไม่สามารถยืนยันการชำระเงินจากหลักฐานที่ส่งมาได้ โปรดตรวจสอบและส่งอีกครั้ง`,
    html: baseEmailHtml({
      badge: en ? "Payment Issue" : "หลักฐานการชำระเงินไม่ถูกต้อง",
      badgeBg: "#fee2e2",
      badgeColor: "#b91c1c",
      alert: en ? "We couldn't verify your proof of payment" : "หลักฐานการชำระเงินเกิดข้อผิดพลาด",
      icon: "alert",
      headline: en ? "Proof of Payment Issue" : "หลักฐานการชำระเงินเกิดข้อผิดพลาด",
      intro: en
        ? `Hi <b>${escapeHtml(customerName)}</b><br>We weren't able to verify your proof of payment. Please check and resubmit.`
        : `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>เราไม่สามารถยืนยันการชำระเงินจากหลักฐานที่ส่งมาได้ โปรดตรวจสอบและส่งอีกครั้ง`,
      detailRows: [
        { label: en ? "Status" : "สถานะการชำระเงิน", value: en ? "Payment Issue" : "หลักฐานการชำระเงินไม่ถูกต้อง", color: "#b91c1c" },
      ],
      note: message ? { label: en ? "Note from store" : "แจ้งให้ทราบ", text: message } : undefined,
      customerPhone,
      ctaLabel: en ? "View order / Track status" : undefined,
      footerText: en ? "This is an automated email — please do not reply." : undefined,
    }),
  };
}

export function trackingNumberEmail(
  customerName: string,
  trackingNumber: string,
  to = "",
  customerPhone?: string,
  lang: "th" | "en" = "th",
): EmailPayload {
  const en = lang === "en";
  return {
    to,
    subject: en ? "HLLC Store – Your order has shipped" : "HLLC Store - จัดส่งสินค้าแล้ว",
    text: en
      ? `Hi ${customerName}, your order has shipped. Tracking number: ${trackingNumber}. Track with Flash Express: https://www.flashexpress.co.th/fle/tracking/?se=${encodeURIComponent(trackingNumber)}`
      : `สวัสดีคุณ ${customerName}, คำสั่งซื้อของคุณถูกจัดส่งแล้ว เลขพัสดุ: ${trackingNumber} ติดตามพัสดุ Flash Express: https://www.flashexpress.co.th/fle/tracking/?se=${encodeURIComponent(trackingNumber)}`,
    html: baseEmailHtml({
      badge: en ? "Shipped" : "จัดส่งแล้ว",
      badgeBg: "#dbeafe",
      badgeColor: "#1d4ed8",
      alert: en ? "Your order is on its way" : "สินค้าของคุณถูกจัดส่งแล้ว",
      icon: "arrow",
      headline: en ? "Your package is on the way" : "พัสดุของคุณกำลังเดินทาง",
      intro: en
        ? `Hi <b>${escapeHtml(customerName)}</b><br>Your order is on its way! Use the tracking number below to check delivery status.`
        : `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>คำสั่งซื้อของคุณถูกจัดส่งเรียบร้อยแล้ว สามารถใช้หมายเลขพัสดุด้านล่างเพื่อติดตามสถานะการจัดส่ง`,
      detailRows: [
        { label: en ? "Status" : "สถานะ", value: en ? "Shipped" : "จัดส่งแล้ว", color: "#1d4ed8" },
        { label: en ? "Tracking number" : "เลขพัสดุ", value: trackingNumber },
        {
          label: en ? "Track via Flash Express" : "ติดตามพัสดุ Flash Express",
          value: en ? "Check delivery status →" : "กดที่นี่เพื่อติดตาม →",
          href: `https://www.flashexpress.co.th/fle/tracking/?se=${encodeURIComponent(trackingNumber)}`,
          color: "#1d4ed8",
        },
      ],
      customerPhone,
      ctaLabel: en ? "View order / Track status" : undefined,
      footerText: en ? "This is an automated email — please do not reply." : undefined,
    }),
  };
}

export function pickupReadyEmail(
  customerName: string,
  to = "",
  customerPhone?: string,
  location?: string,
  pickupHours?: string,
  lang: "th" | "en" = "th",
): EmailPayload {
  const en = lang === "en";
  return {
    to,
    subject: en ? "HLLC Store – Ready for Pickup" : "HLLC Store - สินค้าพร้อมให้รับแล้ว",
    text: en
      ? `Hi ${customerName}, your order is ready for pickup${location ? ` at ${location}` : ""}${pickupHours ? `, ${pickupHours}` : ""}.`
      : `สวัสดีคุณ ${customerName}, คำสั่งซื้อของคุณพร้อมให้มารับแล้ว${location ? `ที่ ${location}` : ""}${pickupHours ? ` เวลา ${pickupHours}` : ""}`,
    html: baseEmailHtml({
      badge: en ? "Ready for Pickup" : "พร้อมรับสินค้า",
      badgeBg: "#fef3c7",
      badgeColor: "#92400e",
      alert: en ? "Your order is ready for pickup" : "สินค้าพร้อมรับแล้วที่จุดรับสินค้า",
      icon: "star",
      headline: en ? "Ready for pickup!" : "สินค้าพร้อมให้เข้ารับแล้ว",
      intro: en
        ? `Hi <b>${escapeHtml(customerName)}</b><br>Your order is ready. Please provide your phone number to our staff when picking up.`
        : `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>คำสั่งซื้อของคุณพร้อมให้เข้ารับแล้ว กรุณาแสดงเบอร์โทรที่ใช้สั่งซื้อกับเจ้าหน้าที่`,
      detailRows: [
        { label: en ? "Status" : "สถานะ", value: en ? "Ready for Pickup" : "พร้อมรับสินค้า", color: "#92400e" },
        ...(location ? [{ label: en ? "Location" : "จุดรับสินค้า", value: location }] : []),
        ...(pickupHours ? [{ label: en ? "Hours" : "เวลารับสินค้า", value: pickupHours }] : []),
      ],
      customerPhone,
      ctaLabel: en ? "View order / Track status" : undefined,
      footerText: en ? "This is an automated email — please do not reply." : undefined,
    }),
  };
}

function formatItemValue(i: { name: string; nameEn?: string; option?: string; customName?: string }, lang: "th" | "en" = "th"): string {
  const displayName = (lang === "en" && i.nameEn) ? i.nameEn : i.name;
  let base = i.option ? `${displayName} (${i.option})` : displayName;
  if (i.customName?.startsWith("charm:")) {
    const parts = i.customName.slice(6).split(":");
    const color = parts[0] ?? "";
    const letters = parts[1] ?? "";
    if (lang === "en") {
      base += ` + keychain, ${color}`;
      if (letters) base += ` · ${letters}`;
    } else {
      base += ` + พวงกุญแจ สี${color}`;
      if (letters) base += ` · ${letters}`;
    }
  }
  return base;
}

export function orderConfirmedEmail(
  customerName: string,
  to = "",
  opts: {
    items: { name: string; nameEn?: string; qty: number; option?: string; customName?: string }[];
    deliveryMode: "delivery" | "pickup";
    customerPhone?: string;
    pickupLocation?: string;
    lang?: "th" | "en";
  },
): EmailPayload {
  const en = opts.lang === "en";
  const deliveryLabel = opts.deliveryMode === "pickup"
    ? (opts.pickupLocation ? (en ? `Pickup at ${opts.pickupLocation}` : `รับที่ ${opts.pickupLocation}`) : (en ? "Pickup at store" : "รับที่ร้าน"))
    : (en ? "Delivery" : "จัดส่งพัสดุ");
  const itemRows = opts.items.map((i) => ({
    label: `${i.qty}×`,
    value: formatItemValue(i, opts.lang),
  }));
  return {
    to,
    subject: en ? "HLLC Store – Order received" : "HLLC Store - รับคำสั่งซื้อเรียบร้อยแล้ว",
    text: en
      ? `Hi ${customerName}, your order has been received: ${opts.items.map((i) => `${i.qty}× ${i.nameEn ?? i.name}`).join(", ")}`
      : `สวัสดีคุณ ${customerName}, เราได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว: ${opts.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}`,
    html: baseEmailHtml({
      badge: en ? "Order Received" : "รับคำสั่งซื้อแล้ว",
      badgeBg: "#ede9fe",
      badgeColor: "#5b21b6",
      alert: en ? "Your order has been received" : "เราได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว",
      icon: "check",
      headline: en ? "Thanks for your order!" : "ขอบคุณที่สั่งซื้อกับเรา!",
      intro: en
        ? `Hi <b>${escapeHtml(customerName)}</b><br>Your order is confirmed `
        : `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>คำสั่งซื้อของคุณสำเร็จแล้ว`,
      detailRows: [
        ...itemRows,
        { label: en ? "Delivery" : "วิธีรับสินค้า", value: deliveryLabel },
        { label: en ? "Status" : "สถานะ", value: en ? "Under payment review" : "รอตรวจสอบการชำระเงิน", color: "#92400e" },
      ],
      customerPhone: opts.customerPhone,
      ctaLabel: en ? "View order / Track status" : undefined,
      footerText: en ? "This is an automated email — please do not reply." : undefined,
    }),
  };
}

export function slipReceivedEmail(customerName: string, to = "", customerPhone?: string, lang: "th" | "en" = "th"): EmailPayload {
  const en = lang === "en";
  return {
    to,
    subject: en ? "HLLC Store – Payment slip received" : "HLLC Store - ได้รับหลักฐานการชำระเงินแล้ว",
    text: en
      ? `Hi ${customerName}, we got your payment slip and are reviewing it now. We'll update you soon.`
      : `สวัสดีคุณ ${customerName}, เราได้รับหลักฐานการชำระเงินของคุณแล้ว`,
    html: baseEmailHtml({
      badge: en ? "Under Review" : "รอตรวจสอบหลักฐานการชำระเงิน",
      badgeBg: "#fef3c7",
      badgeColor: "#92400e",
      alert: en ? "We've received your proof of payment" : "เราได้รับหลักฐานการชำระเงินของคุณแล้ว กำลังตรวจสอบ",
      icon: "clock",
      headline: en ? "Proof of Payment Received" : "ได้รับหลักฐานการชำระเงินเรียบร้อยแล้ว",
      intro: en
        ? `Hi <b>${escapeHtml(customerName)}</b><br>We're reviewing your proof of payment now. We'll notify you once it's verified.`
        : `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>ขณะนี้คำสั่งซื้อของคุณอยู่ระหว่างการตรวจสอบหลักฐานการชำระเงิน เมื่อการตรวจสอบเสร็จสิ้น ระบบจะแจ้งผลให้ท่านโดยอัตโนมัติ`,
      detailRows: [
        { label: en ? "Status" : "สถานะ", value: en ? "Under review" : "รอตรวจสอบ", color: "#92400e" },
      ],
      customerPhone,
      ctaLabel: en ? "View order / Track status" : undefined,
      footerText: en ? "This is an automated email — please do not reply." : undefined,
    }),
  };
}

export function orderCompletedEmail(customerName: string, to = "", customerPhone?: string, lang: "th" | "en" = "th"): EmailPayload {
  const en = lang === "en";
  return {
    to,
    subject: en ? "HLLC Store – Order Completed" : "HLLC Store - รับสินค้าเรียบร้อยแล้ว",
    text: en
      ? `Hi ${customerName}, Hope you enjoy your purchase! Thanks for shopping with us`
      : `สวัสดีคุณ ${customerName}, หวังว่าคุณจะชื่นชอบสินค้าของเรา ขอบคุณสำหรับการสนับสนุนค่ะ/ครับ`,
    html: baseEmailHtml({
      badge: en ? "Completed" : "เสร็จสมบูรณ์",
      badgeBg: "#dcfce7",
      badgeColor: "#166534",
      alert: en ? "Your order has been completed" : "คำสั่งซื้อของคุณเสร็จสมบูรณ์แล้ว",
      icon: "check",
      headline: en ? "Enjoy your purchase!" : "รับสินค้าเรียบร้อย!",
      intro: en
        ? `Hi <b>${escapeHtml(customerName)}</b><br>Hope you enjoy your purchase! Thanks for shopping with us.`
        : `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>หวังว่าคุณจะชื่นชอบสินค้าของเรา ขอบคุณสำหรับการสนับสนุนค่ะ/ครับ`,
      detailRows: [
        { label: en ? "Status" : "สถานะ", value: en ? "Completed" : "คำสั่งซื้อของคุณเสร็จสมบูรณ์", color: "#166534" },
      ],
      customerPhone,
      ctaLabel: en ? "View order / Track status" : undefined,
      footerText: en ? "This is an automated email — please do not reply." : undefined,
    }),
  };
}

export function orderCancelledEmail(customerName: string, reason: string, to = "", customerPhone?: string, lang: "th" | "en" = "th"): EmailPayload {
  const message = reason?.trim();
  const en = lang === "en";
  return {
    to,
    subject: en ? "HLLC Store – Cancelled" : "HLLC Store - คำสั่งซื้อถูกยกเลิก",
    text: en
      ? `Hi ${customerName}, your order has been cancelled.${message ? ` Reason: ${message}` : ""}`
      : `สวัสดีคุณ ${customerName}, คำสั่งซื้อของคุณถูกยกเลิกแล้ว${message ? ` เหตุผล: ${message}` : ""}`,
    html: baseEmailHtml({
      badge: en ? "Cancelled" : "ยกเลิกคำสั่งซื้อ",
      badgeBg: "#fee2e2",
      badgeColor: "#b91c1c",
      alert: en ? "Your order has been cancelled" : "คำสั่งซื้อนี้ถูกยกเลิกเรียบร้อยแล้ว",
      icon: "x",
      headline: en ? "Order Cancelled" : "คำสั่งซื้อถูกยกเลิก",
      intro: en
        ? `Hi <b>${escapeHtml(customerName)}</b><br>Your order has been cancelled. If you already paid, a full refund will be processed.`
        : `สวัสดีคุณ <b>${escapeHtml(customerName)}</b><br>คำสั่งซื้อถูกยกเลิกแล้ว ในกรณีที่ชำระเงินสำเร็จ ระบบจะทำการคืนเงินให้เต็มจำนวน`,
      detailRows: [
        { label: en ? "Status" : "สถานะ", value: en ? "Cancelled" : "ยกเลิกคำสั่งซื้อ", color: "#b91c1c" },
      ],
      note: message ? { label: en ? "Reason" : "ระบุเหตุผลการยกเลิก", text: message } : undefined,
      customerPhone,
      ctaLabel: en ? "View order / Track status" : undefined,
      footerText: en ? "This is an automated email — please do not reply." : undefined,
    }),
  };
}
