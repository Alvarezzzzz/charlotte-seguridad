import { Router } from "express";
import { EnumController } from "../controllers/enum.js"; 

export const createEnumRouter = () => {
  const router = Router();
  const enumController = new EnumController();

  router.get("/User/dataType", enumController.getUserDataTypes);
  router.get("/Permission/type", enumController.getPermissionTypes);
  router.get("/Permission/resource", enumController.getPermissionResources);
  router.get("/Permission/method", enumController.getPermissionMethods);

  return router;
};