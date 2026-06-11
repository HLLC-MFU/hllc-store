import { ok, badRequest } from "@/lib/backend/http";
import * as settingsService from "./settings-service";

export async function getPaymentSettings() {
  try {
    return ok(await settingsService.getPaymentSettings());
  } catch (error) {
    return badRequest(error);
  }
}

export async function updatePaymentSettings(request: Request) {
  try {
    const body = await request.json();
    return ok(await settingsService.updatePaymentSettings(body));
  } catch (error) {
    return badRequest(error);
  }
}

export async function getShippingSettings() {
  try {
    return ok(await settingsService.getShippingSettings());
  } catch (error) {
    return badRequest(error);
  }
}

export async function updateShippingSettings(request: Request) {
  try {
    const body = await request.json();
    return ok(await settingsService.updateShippingSettings(body));
  } catch (error) {
    return badRequest(error);
  }
}
