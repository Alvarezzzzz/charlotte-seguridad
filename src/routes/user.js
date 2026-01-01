import { Router } from "express";
import { UserController } from "../controllers/user.js";
import { authenticateToken } from "../middlewares/auth.js";

export const createUserRouter = () => {
  const router = Router();
  const userController = new UserController();

  router.post("/", authenticateToken, userController.createUser);
  router.get("/", authenticateToken, userController.getAllUsers);

  router.patch("/", authenticateToken, userController.updateUserByToken);

  router.get("/:id", userController.getUserById);

  router.patch("/:id", authenticateToken, userController.updateUser);
  router.delete("/:id", authenticateToken, userController.deleteUser);

  return router;
};
