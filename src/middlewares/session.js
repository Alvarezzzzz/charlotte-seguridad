import { authenticateToken } from './auth.js';

export function sessionMiddleware(req, res, next) {
  // El middleware de autenticación se aplica solo a rutas específicas
  // Las rutas públicas (login, verify-location) no requieren autenticación
  next();
}