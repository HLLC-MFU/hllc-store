import { requireSuperAdmin } from "../admin-auth";
import { badRequest, ok } from "../http";
import { readLimitedJson } from "../request-utils";
import * as adminUserService from "../admin-user-service";
import { requireActor } from "./admin-controller-utils";

export async function listUsers(request: Request) {
  const authError = requireSuperAdmin(request);
  if (authError) return authError;

  try {
    return ok(await adminUserService.listAdminUsers());
  } catch (error) {
    return badRequest(error);
  }
}

export async function createUser(request: Request) {
  const authError = requireSuperAdmin(request);
  if (authError) return authError;

  try {
    const actor = requireActor(request);
    const body = await readLimitedJson<{ username?: unknown; role?: unknown }>(request, 16_000);

    return ok(await adminUserService.createAdminUser(body, actor), { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}

export async function deleteUser(request: Request) {
  const authError = requireSuperAdmin(request);
  if (authError) return authError;

  try {
    const actor = requireActor(request);
    const body = await readLimitedJson<{ username?: unknown }>(request, 8_000);
    const username = String(body.username ?? "").trim();
    if (!username) throw new Error("username is required");

    return ok(await adminUserService.deleteAdminUser(username, actor));
  } catch (error) {
    return badRequest(error);
  }
}

export async function resetPassword(request: Request) {
  const authError = requireSuperAdmin(request);
  if (authError) return authError;

  try {
    const actor = requireActor(request);
    const body = await readLimitedJson<{ username?: unknown; action?: unknown }>(request, 8_000);
    const username = String(body.username ?? "").trim();
    if (!username) throw new Error("username is required");

    return ok(await adminUserService.resetAdminPassword(username, actor));
  } catch (error) {
    return badRequest(error);
  }
}
