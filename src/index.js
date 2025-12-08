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

app.use('/api/users', createUserRouter());
app.use('/api/roles', createRoleRouter());
app.use('/api/permissions', createPermissionRouter());
app.use('/api/products', createProductRouter());

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});