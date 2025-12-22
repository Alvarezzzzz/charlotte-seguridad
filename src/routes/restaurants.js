import { Router } from "express";
// Cambia 'restaurant.js' por 'restaurants.js'
import { RestaurantController } from "../controllers/restaurants.js"; 
import { authenticateToken } from "../middlewares/auth.js";

export const createRestaurantRouter = () => {
  const router = Router();
  const restaurantController = new RestaurantController();

  router.use(authenticateToken);

  router.get("/", restaurantController.getRestaurantInfo);
  router.get("/:id", restaurantController.getRestaurantById);
  router.post("/", restaurantController.createRestaurant);
  router.patch("/", restaurantController.updateRestaurantCoordinates);
  router.delete("/:id", restaurantController.deleteRestaurant);

  return router;
};