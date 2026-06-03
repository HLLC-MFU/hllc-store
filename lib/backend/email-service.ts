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

function getRequiredEnv(name: "GMAIL_USER" | "GMAIL_APP_PASSWORD") {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required. Set it in .env using a Gmail App Password.`);
  }

  return name === "GMAIL_APP_PASSWORD" ? value.replace(/\s/g, "") : value;
}

function getEmailTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: getRequiredEnv("GMAIL_USER"),
      pass: getRequiredEnv("GMAIL_APP_PASSWORD"),
    },
  });

  return transporter;
}

export function validateEmailPayload(payload: EmailPayload) {
  if (!payload.to?.trim()) {
    throw new Error("to is required");
  }

  if (!payload.subject?.trim()) {
    throw new Error("subject is required");
  }

  if (!payload.text?.trim() && !payload.html?.trim()) {
    throw new Error("text or html is required");
  }
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  validateEmailPayload(payload);

  await getEmailTransporter().sendMail({
    from: getRequiredEnv("GMAIL_USER"),
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}

export function slipApprovedEmail(customerName: string, orderId: string): EmailPayload {
  return {
    to: "",
    subject: "Order payment approved",
    text: `Hello ${customerName}, your payment slip for order #${orderId.slice(-6).toUpperCase()} has been approved.`,
  };
}

export function slipRejectedEmail(customerName: string, orderId: string, note?: string): EmailPayload {
  return {
    to: "",
    subject: "Please upload a new payment slip",
    text: `Hello ${customerName}, your payment slip for order #${orderId.slice(-6).toUpperCase()} was not approved.${note ? ` Reason: ${note}` : ""} Please upload a new payment slip.`,
  };
}

export function slipResetEmail(customerName: string, orderId: string, note?: string): EmailPayload {
  return {
    to: "",
    subject: "Please resend your payment slip",
    text: `Hello ${customerName}, our team needs to review the payment slip for order #${orderId.slice(-6).toUpperCase()} again.${note ? ` Reason: ${note}` : ""} Please upload a new payment slip.`,
  };
}

export function orderCancelledEmail(customerName: string, orderId: string, reason: string): EmailPayload {
  return {
    to: "",
    subject: "Order cancelled",
    text: `Hello ${customerName}, order #${orderId.slice(-6).toUpperCase()} was cancelled. Reason: ${reason}`,
  };
}
