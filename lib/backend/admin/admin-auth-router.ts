import * as adminAuthController from "./admin-auth-controller";

export const adminAuthRouter = {
  GET: adminAuthController.getSession,
  POST: adminAuthController.login,
  DELETE: adminAuthController.logout,
};
