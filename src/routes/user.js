import { Router } from "express";
import { UserController } from "../controllers/user.js";

export const createUserRouter = () => {
  const router = Router();
  const userController = new UserController();

  router.post("/", userController.createUser);
  router.get("/:id", userController.getUserById);
  router.patch("/:id", userController.updateUser);
  router.delete("/:id", userController.deleteUser);
  router.get("/", userController.getAllUsers);

  return router;
};