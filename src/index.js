import { PORT } from './config.js';
import express, { json } from 'express';
import { createUserRouter } from './routes/user.js';
import { createRoleRouter } from './routes/role.js';
import { createPermissionRouter } from './routes/permission.js';
import { createProductRouter } from './routes/product.js';
import { corsMiddleware } from './middlewares/cors.js';
import { sessionMiddleware } from './middlewares/session.js';


const app = express();
app.use(json());
app.use(sessionMiddleware);
app.use(corsMiddleware());
app.disable('x-powered-by');

app.use('/api/seguridad/users', createUserRouter());
app.use('/api/seguridad/roles', createRoleRouter());
app.use('/api/seguridad/permissions', createPermissionRouter());
app.use('/api/seguridad/products', createProductRouter());

app.listen(PORT, () => {
  console.log(`Server is running in http://localhost:${PORT}`);
});
