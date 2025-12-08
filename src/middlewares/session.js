export function sessionMiddleware(req, res, next) {
  console.log("Session middleware ejecutado");
  // Aqui se extraeria el token del header Authorization que envie el frontend y se decodificaria con un secret y se guardaria la data en req.session
  next();
}