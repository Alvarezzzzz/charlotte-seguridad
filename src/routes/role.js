import { Router } from 'express';
import { RoleController } from '../controllers/role.js';
import { authenticateToken } from '../middlewares/auth.js';

export const createRoleRouter = () => {
  const router = Router();
  const roleController = new RoleController();
  
  router.use(authenticateToken);

  router.get('/', roleController.getAllRoles);
  router.get('/:id', roleController.getRoleById);
  router.post('/', roleController.createRole);
  router.patch('/:id', roleController.updateRole);
  router.delete('/:id', roleController.deleteRole);

  return router;
};