import { authenticateToken } from './auth.js';

export function sessionMiddleware(req, res, next) {
  if (req.headers.authorization) {
    // Esto quita las comillas si existen antes de pasar el token al validador
    req.headers.authorization = req.headers.authorization.replace(/"/g, '');
  }

  console.log("Headers limpios:", req.headers.authorization);

  authenticateToken(req, res, (err) => {
    console.log("Usuario tras autenticación:", req.user);
    if (err) return next(err);
    
    if (!req.user && req.auth) {
      req.user = req.auth; 
    }
    next();
  });
}