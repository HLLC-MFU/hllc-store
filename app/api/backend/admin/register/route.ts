import { NextRequest } from "next/server";
import { badRequest, ok } from "@/lib/backend/http";
import { registerAdminPassword } from "@/lib/backend/admin-user-service";
import { readLimitedJson } from "@/lib/backend/request-utils";
import { adminRegisterBackendSchema, parseOrThrow } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await readLimitedJson<{ username?: unknown; password?: unknown }>(request, 16_000);
    const parsed = parseOrThrow(adminRegisterBackendSchema, body ?? {});

    return ok(await registerAdminPassword(parsed));
  } catch (error) {
    return badRequest(error);
  }
}
