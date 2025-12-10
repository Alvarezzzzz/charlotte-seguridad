import { Router } from "express";
import { PermissionController } from "../controllers/permission.js";

export const createPermissionRouter = () => {
  const router = Router();
  const permissionController = new PermissionController();

  router.post("/", permissionController.createPermission);
  router.get("/:id", permissionController.getPermissionById);
  router.patch("/:id", permissionController.updatePermission);
  router.delete("/:id", permissionController.deletePermission);
  router.get("/", permissionController.getAllPermissions);

  return router;
};