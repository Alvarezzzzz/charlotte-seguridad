import { Router } from "express";
import { PermissionController } from "../controllers/permission.js";
import { authenticateToken } from "../middlewares/auth.js";

export const createPermissionRouter = () => {
  const router = Router();
  const permissionController = new PermissionController();

  router.use(authenticateToken);

  router.get("/", permissionController.getAllPermissions);
  router.get("/:id", permissionController.getPermissionById);
  router.post("/", permissionController.createPermission);
  router.patch("/:id", permissionController.updatePermission);
  router.delete("/:id", permissionController.deletePermission);

  return router;
};