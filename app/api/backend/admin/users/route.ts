import { NextRequest } from "next/server";
import { getAdminIdentity, requireSuperAdmin } from "@/lib/backend/admin-auth";
import { badRequest, ok } from "@/lib/backend/http";
import { createAdminUser, listAdminUsers } from "@/lib/backend/admin-user-service";
import { readLimitedJson } from "@/lib/backend/request-utils";

export async function GET(request: NextRequest) {
  const authError = requireSuperAdmin(request);
  if (authError) return authError;

  try {
    return ok(await listAdminUsers());
  } catch (error) {
    return badRequest(error);
  }
}

export async function POST(request: NextRequest) {
  const authError = requireSuperAdmin(request);
  if (authError) return authError;

  try {
    const actor = getAdminIdentity(request);
    if (!actor) throw new Error("admin session required");
    const body = await readLimitedJson<{ username?: unknown; role?: unknown }>(request, 16_000);

    return ok(await createAdminUser(body, actor), { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
