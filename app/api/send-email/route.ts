import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/backend/email-service";
import { readLimitedJson } from "@/lib/backend/request-utils";
import { emailPayloadSchema, parseOrThrow } from "@/lib/schemas";

type SendEmailBody = {
  to?: unknown;
  subject?: unknown;
  text?: unknown;
  html?: unknown;
};

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
    const payload = parseOrThrow(emailPayloadSchema, {
      to: body.to,
      subject: body.subject,
      text: body.text,
      html: body.html,
    });

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
