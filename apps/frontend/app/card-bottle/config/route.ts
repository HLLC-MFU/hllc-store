import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "",
  });
}
