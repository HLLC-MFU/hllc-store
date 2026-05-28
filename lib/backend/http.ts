import { NextResponse } from "next/server";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function badRequest(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "bad request" },
    { status: 400 },
  );
}

export function notFound(message = "not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}
