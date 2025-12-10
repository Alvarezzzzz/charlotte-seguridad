import { Router } from 'express';
import { RoleController } from '../controllers/role.js';

export const createRoleRouter = () => {
  const router = Router();
  const roleController = new RoleController();
  
  router.post('/', roleController.createRole);
  router.get('/:id', roleController.getRoleById);
  router.patch('/:id', roleController.updateRole);
  router.delete('/:id', roleController.deleteRole);
  router.get('/', roleController.getAllRoles);

  return router;
};