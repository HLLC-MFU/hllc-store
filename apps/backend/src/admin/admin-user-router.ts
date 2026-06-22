import * as adminUserController from "./admin-user-controller";

export const adminUserRouter = {
  GET: adminUserController.listUsers,
  POST: adminUserController.createUser,
  DELETE: adminUserController.deleteUser,
  PATCH: adminUserController.resetPassword,
};
