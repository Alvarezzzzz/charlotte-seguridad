import { Router } from 'express';
import { RestaurantController } from '../controllers/restaurants.js';

export const createRestaurantRouter = () => {
  const router = Router();
  const restaurantController = new RestaurantController();
  
  router.post('/', restaurantController.createRestaurant);
  router.get('/:id', restaurantController.getRestaurantById);
  router.patch('/:id', restaurantController.updateRestaurant);
  router.delete('/:id', restaurantController.deleteRestaurant);
  router.get('/', restaurantController.getAllRestaurants);

  return router;
};