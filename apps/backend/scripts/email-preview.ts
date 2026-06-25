import { writeFileSync } from "fs";
import { join } from "path";
import {
  orderConfirmedEmail,
  slipReceivedEmail,
  slipApprovedEmail,
  slipRejectedEmail,
  trackingNumberEmail,
  pickupReadyEmail,
  orderCompletedEmail,
  orderCancelledEmail,
} from "../src/email-service";

const dummyItems = [
  { name: "Denim Tumbler", nameEn: "Denim Tumbler", qty: 1 },
  { name: "Memoria Charm", nameEn: "Memoria Charm", qty: 2 },
];

const previews: { title: string; th: string; en: string }[] = [
  {
    title: "1. Order confirmed (delivery)",
    th: orderConfirmedEmail("สมชาย ใจดี", "", { items: dummyItems, deliveryMode: "delivery", customerPhone: "0812345678", lang: "th" }).html!,
    en: orderConfirmedEmail("Alex", "", { items: dummyItems, deliveryMode: "delivery", customerPhone: "0812345678", lang: "en" }).html!,
  },
  {
    title: "2. Order confirmed (pickup)",
    th: orderConfirmedEmail("สมชาย ใจดี", "", { items: dummyItems, deliveryMode: "pickup", customerPhone: "0812345678", pickupLocation: "หน้าร้าน HLLC", lang: "th" }).html!,
    en: orderConfirmedEmail("Alex", "", { items: dummyItems, deliveryMode: "pickup", customerPhone: "0812345678", pickupLocation: "HLLC Store", lang: "en" }).html!,
  },
  {
    title: "3. Slip received",
    th: slipReceivedEmail("สมชาย ใจดี", "", "0812345678", "th").html!,
    en: slipReceivedEmail("Alex", "", "0812345678", "en").html!,
  },
  {
    title: "4. Slip approved",
    th: slipApprovedEmail("สมชาย ใจดี", "", "0812345678", "th").html!,
    en: slipApprovedEmail("Alex", "", "0812345678", "en").html!,
  },
  {
    title: "5. Slip rejected",
    th: slipRejectedEmail("สมชาย ใจดี", "รูปภาพไม่ชัดเจน", "", "0812345678", "th").html!,
    en: slipRejectedEmail("Alex", "The image is too blurry to read.", "", "0812345678", "en").html!,
  },
  {
    title: "6. Tracking number",
    th: trackingNumberEmail("สมชาย ใจดี", "TH123456789", "", "0812345678", "th").html!,
    en: trackingNumberEmail("Alex", "TH123456789", "", "0812345678", "en").html!,
  },
  {
    title: "7. Pickup ready",
    th: pickupReadyEmail("สมชาย ใจดี", "", "0812345678", "หน้าร้าน HLLC", "10:00–18:00", "th").html!,
    en: pickupReadyEmail("Alex", "", "0812345678", "HLLC Store", "10:00–18:00", "en").html!,
  },
  {
    title: "8. Order completed",
    th: orderCompletedEmail("สมชาย ใจดี", "", "0812345678", "th").html!,
    en: orderCompletedEmail("Alex", "", "0812345678", "en").html!,
  },
  {
    title: "9. Order cancelled",
    th: orderCancelledEmail("สมชาย ใจดี", "สินค้าหมดสต็อก", "", "0812345678", "th").html!,
    en: orderCancelledEmail("Alex", "Item out of stock.", "", "0812345678", "en").html!,
  },
];

const sections = previews
  .map(
    (p) => `
  <section style="margin:0 0 60px;">
    <h2 style="font-family:sans-serif;font-size:16px;font-weight:800;color:#111;margin:0 0 16px;padding:10px 16px;background:#f3f4f6;border-radius:10px;">${p.title}</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div>
        <p style="font-family:sans-serif;font-size:11px;font-weight:700;color:#6b7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Thai</p>
        <iframe srcdoc="${p.th.replace(/"/g, "&quot;")}" style="width:100%;height:600px;border:1px solid #e5e7eb;border-radius:12px;" sandbox="allow-same-origin"></iframe>
      </div>
      <div>
        <p style="font-family:sans-serif;font-size:11px;font-weight:700;color:#6b7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">English</p>
        <iframe srcdoc="${p.en.replace(/"/g, "&quot;")}" style="width:100%;height:600px;border:1px solid #e5e7eb;border-radius:12px;" sandbox="allow-same-origin"></iframe>
      </div>
    </div>
  </section>`,
  )
  .join("");

const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HLLC Email Previews</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; background: #f9fafb; }
    h1 { font-family: sans-serif; font-size: 24px; font-weight: 900; color: #111; margin: 0 0 32px; }
  </style>
</head>
<body>
  <h1>HLLC Email Previews</h1>
  ${sections}
</body>
</html>`;

const outPath = join(process.cwd(), "email-previews.html");
writeFileSync(outPath, html, "utf-8");
console.log(`Generated: ${outPath}`);
