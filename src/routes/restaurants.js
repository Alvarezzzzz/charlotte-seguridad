import { Router } from 'express';
import { RestaurantController } from '../controllers/restaurants.js';
import { authenticateToken } from '../middlewares/auth.js';

export const createRestaurantRouter = () => {
  const router = Router();
  const restaurantController = new RestaurantController();
  
  router.post('/', restaurantController.createRestaurant);
  router.get('/', restaurantController.getAllRestaurants);
  
  // Endpoint 3: PATCH sin ID (actualizar coordenadas) - debe ir ANTES del PATCH con :id
  router.patch('/', authenticateToken, restaurantController.updateRestaurantCoordinates);
  
  router.get('/:id', restaurantController.getRestaurantById);
  router.patch('/:id', restaurantController.updateRestaurant);
  router.delete('/:id', restaurantController.deleteRestaurant);

  return router;
};