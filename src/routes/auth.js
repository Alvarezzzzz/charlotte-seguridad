import { Router } from 'express';
import { AuthController } from '../controllers/auth.js';
import { authenticateToken } from '../middlewares/auth.js';

export const createAuthRouter = () => {
  const router = Router();
  const authController = new AuthController();

  // POST /api/seguridad/auth/login
  router.post('/login', authController.login.bind(authController));

  // POST /api/seguridad/auth/rol
  router.post('/rol', authenticateToken, authController.getRoles.bind(authController));

  // POST /api/seguridad/auth/verify-location
  router.post('/verify-location', authController.verifyLocation.bind(authController));

  // POST /api/seguridad/auth/passwordChange/admin
  router.post(
    '/passwordChange/admin',
    authenticateToken,
    authController.changePasswordAdmin.bind(authController)
  );

  // POST /api/seguridad/auth/passwordChange
  router.post(
    '/passwordChange',
    authenticateToken,
    authController.changePassword.bind(authController)
  );

  // POST /api/seguridad/auth/clientSession
  router.post('/clientSession', authController.clientSession.bind(authController));

  return router;
};


