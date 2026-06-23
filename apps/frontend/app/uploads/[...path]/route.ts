import { type NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  const url = new URL(req.url);
  const upstream = new URL(`/uploads/${ctx.params.path.join("/")}${url.search}`, BACKEND_URL);
  const response = await fetch(upstream, { method: "GET", redirect: "manual" });
  return new Response(response.body, { status: response.status, headers: response.headers });
}
