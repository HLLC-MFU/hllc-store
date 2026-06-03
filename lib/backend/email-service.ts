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
    from: getSenderEmail(),
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
