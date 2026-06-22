import * as settingsController from "./settings-controller";

export const paymentSettingsRouter = {
  GET: settingsController.getPaymentSettings,
};

export const adminPaymentSettingsRouter = {
  GET: settingsController.getPaymentSettings,
  PATCH: (request: Request) => settingsController.updatePaymentSettings(request),
};

export const shippingSettingsRouter = {
  GET: settingsController.getShippingSettings,
};

export const adminShippingSettingsRouter = {
  GET: settingsController.getShippingSettings,
  PATCH: (request: Request) => settingsController.updateShippingSettings(request),
};

export const homeContentRouter = {
  GET: settingsController.getHomeContent,
};

export const adminHomeContentRouter = {
  GET: settingsController.getHomeContent,
  PATCH: (request: Request) => settingsController.updateHomeContent(request),
};

export const charmSettingsRouter = {
  GET: settingsController.getCharmSettings,
};

export const adminCharmSettingsRouter = {
  GET: settingsController.getCharmSettings,
  PATCH: (request: Request) => settingsController.updateCharmSettings(request),
};
