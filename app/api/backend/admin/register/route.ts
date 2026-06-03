import { NextRequest } from "next/server";
import { badRequest, ok } from "@/lib/backend/http";
import { registerAdminPassword } from "@/lib/backend/admin-user-service";
import { readLimitedJson } from "@/lib/backend/request-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await readLimitedJson<{ username?: unknown; password?: unknown }>(request, 16_000);

    return ok(await registerAdminPassword(body));
  } catch (error) {
    return badRequest(error);
  }
}
