import type { NextRequest } from "next/server";
import * as settingsController from "./settings-controller";

export const paymentSettingsRouter = {
  GET: settingsController.getPaymentSettings,
};

export const adminPaymentSettingsRouter = {
  GET: settingsController.getPaymentSettings,
  PATCH: (request: NextRequest) => settingsController.updatePaymentSettings(request),
};
