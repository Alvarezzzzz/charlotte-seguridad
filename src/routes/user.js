import { Router } from "express";
import { UserController } from "../controllers/user.js";
import { authenticateToken } from "../middlewares/auth.js";

export const createUserRouter = () => {
  const router = Router();
  const userController = new UserController();

  // Todas las rutas de usuarios requieren autenticación
  router.use(authenticateToken);

  router.post("/", userController.createUser);
  router.get("/:id", userController.getUserById);
  router.patch("/:id", userController.updateUser);
  router.delete("/:id", userController.deleteUser);
  router.get("/", userController.getAllUsers);

  return router;
};