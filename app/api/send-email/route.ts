import { NextRequest, NextResponse } from "next/server";
import { sendEmail, type EmailPayload } from "@/lib/backend/email-service";
import { readLimitedJson } from "@/lib/backend/request-utils";

type SendEmailBody = {
  to?: unknown;
  subject?: unknown;
  text?: unknown;
  html?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function sanitizeEmailError(error: unknown) {
  if (error instanceof Error) {
    if (/Username and Password not accepted|Invalid login|EAUTH/i.test(error.message)) {
      return "Email authentication failed. Check Gmail OAuth2, SMTP credentials, or Gmail App Password settings.";
    }

    return error.message;
  }

  return "failed to send email";
}

export async function POST(request: NextRequest) {
  try {
    const body = await readLimitedJson<SendEmailBody>(request, 32_000);
    const payload: EmailPayload = {
      to: asString(body.to) ?? "",
      subject: asString(body.subject) ?? "",
      text: asString(body.text),
      html: asString(body.html),
    };

    await sendEmail(payload);

    return NextResponse.json({
      status: "200",
      message: "email sent",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "400",
        message: sanitizeEmailError(error),
      },
      { status: 400 },
    );
  }
}
