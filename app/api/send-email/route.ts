import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/backend/email-service";
import { readLimitedJson } from "@/lib/backend/request-utils";
import { requireAdmin } from "@/lib/backend/admin-auth";
import { rateLimit } from "@/lib/backend/rate-limit";
import { tooManyRequests } from "@/lib/backend/http";
import { emailPayloadSchema, parseOrThrow } from "@/lib/validation/schemas";

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
  // Admin-only: prevents the endpoint from being used as an open email relay.
  const authError = requireAdmin(request);
  if (authError) return authError;

  const limit = rateLimit(request, { bucket: "send-email", windowMs: 60_000, max: 10 });
  if (limit.limited) {
    return tooManyRequests(limit.retryAfterSeconds, "too many email requests");
  }

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
