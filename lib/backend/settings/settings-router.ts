import type { NextRequest } from "next/server";
import * as settingsController from "./settings-controller";

export const paymentSettingsRouter = {
  GET: settingsController.getPaymentSettings,
};

export const adminPaymentSettingsRouter = {
  GET: settingsController.getPaymentSettings,
  PATCH: (request: NextRequest) => settingsController.updatePaymentSettings(request),
};

export const shippingSettingsRouter = {
  GET: settingsController.getShippingSettings,
};

export const adminShippingSettingsRouter = {
  GET: settingsController.getShippingSettings,
  PATCH: (request: NextRequest) => settingsController.updateShippingSettings(request),
};

export const homeContentRouter = {
  GET: settingsController.getHomeContent,
};

export const adminHomeContentRouter = {
  GET: settingsController.getHomeContent,
  PATCH: (request: NextRequest) => settingsController.updateHomeContent(request),
};

export const charmSettingsRouter = {
  GET: settingsController.getCharmSettings,
};

export const adminCharmSettingsRouter = {
  GET: settingsController.getCharmSettings,
  PATCH: (request: NextRequest) => settingsController.updateCharmSettings(request),
};
