import { PORT } from "./config.js";
import express, { json } from "express";
import { createUserRouter } from "./routes/user.js";
import { createRoleRouter } from "./routes/role.js";
import { createPermissionRouter } from "./routes/permission.js";
import { createProductRouter } from "./routes/product.js";
import { createAuthRouter } from "./routes/auth.js";
import { createRestaurantRouter } from "./routes/restaurants.js";
import { createEnumRouter } from "./routes/enum.js";
import { corsMiddleware } from "./middlewares/cors.js";
import { sessionMiddleware } from "./middlewares/session.js";

const app = express();
app.use(express.json());
app.use(json());
// app.use(sessionMiddleware);
app.use(corsMiddleware());
app.disable("x-powered-by");

app.use("/api/seguridad/auth", createAuthRouter());
app.use("/api/seguridad/users", createUserRouter());
app.use("/api/seguridad/roles", createRoleRouter());
app.use("/api/seguridad/permissions", createPermissionRouter());
app.use("/api/seguridad/products", createProductRouter());
app.use("/api/seguridad/restaurants", createRestaurantRouter());
app.use("/api/seguridad/enums", createEnumRouter());
app.listen(PORT, () => {
  console.log(`Server is running in http://localhost:${PORT}`);
});
