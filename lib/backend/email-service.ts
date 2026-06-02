// Plug in nodemailer/SendGrid/Resend here when ready
export type EmailPayload = {
  to: string;
  subject: string;
  body: string;
};

export async function sendEmail(payload: EmailPayload): Promise<void> {
  // TODO: connect real email provider
  console.log("[EMAIL STUB]", payload);
}

export function slipApprovedEmail(customerName: string, orderId: string): EmailPayload {
  return {
    to: "", // fill from customer profile when auth is ready
    subject: "คำสั่งซื้อของคุณได้รับการยืนยัน",
    body: `สวัสดีคุณ ${customerName}, สลิปการโอนเงินของคำสั่งซื้อ #${orderId.slice(-6).toUpperCase()} ได้รับการอนุมัติแล้ว`,
  };
}

export function slipRejectedEmail(customerName: string, orderId: string, note?: string): EmailPayload {
  return {
    to: "",
    subject: "กรุณาส่งหลักฐานการโอนเงินใหม่",
    body: `สวัสดีคุณ ${customerName}, สลิปของคำสั่งซื้อ #${orderId.slice(-6).toUpperCase()} ไม่ผ่านการตรวจสอบ${note ? ` เหตุผล: ${note}` : ""} กรุณาส่งหลักฐานใหม่`,
  };
}

export function slipResetEmail(customerName: string, orderId: string, note?: string): EmailPayload {
  return {
    to: "",
    subject: "กรุณาส่งหลักฐานการโอนเงินใหม่อีกครั้ง",
    body: `สวัสดีคุณ ${customerName}, ทีมงานขอตรวจสอบสลิปของคำสั่งซื้อ #${orderId.slice(-6).toUpperCase()} ใหม่อีกครั้ง${note ? ` เหตุผล: ${note}` : ""} กรุณาส่งหลักฐานการโอนเงินมาใหม่`,
  };
}

export function orderCancelledEmail(customerName: string, orderId: string, reason: string): EmailPayload {
  return {
    to: "",
    subject: "คำสั่งซื้อถูกยกเลิก",
    body: `สวัสดีคุณ ${customerName}, คำสั่งซื้อ #${orderId.slice(-6).toUpperCase()} ถูกยกเลิก เหตุผล: ${reason}`,
  };
}
