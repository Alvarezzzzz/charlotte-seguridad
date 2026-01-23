import { Router } from "express";
// Cambia 'restaurant.js' por 'restaurants.js'
import { RestaurantController } from "../controllers/restaurants.js"; 
import { authenticateToken } from "../middlewares/auth.js";

export const createRestaurantRouter = () => {
  const router = Router();
  const restaurantController = new RestaurantController();


  router.get("/", restaurantController.getRestaurantInfo);
  router.get("/:id", restaurantController.getRestaurantById);
  router.post("/", authenticateToken, restaurantController.createRestaurant);
  router.patch("/", authenticateToken, restaurantController.updateRestaurantCoordinates);
  router.delete("/:id", authenticateToken, restaurantController.deleteRestaurant);

  return router;
};
