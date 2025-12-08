import { Router } from 'express';
import { ProductController } from '../controllers/product.js';

export const createProductRouter = () => {
  const router = Router();
  const productController = new ProductController();

  router.post('/', productController.createProduct);
  router.get('/:id', productController.getProductById);
  router.put('/:id', productController.updateProduct);
  router.delete('/:id', productController.deleteProduct);
  router.get('/', productController.getAllProducts);
  
  return router;
}

