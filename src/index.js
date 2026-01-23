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
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../swagger.json"), "utf8")
);

const app = express();
app.use(express.json());
app.use(json());
// app.use(sessionMiddleware);
app.use(corsMiddleware());
app.disable("x-powered-by");

// Documentación de la API con auto-aplicación de Bearer Token
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      // Mantiene la autorización entre recargas
      persistAuthorization: true,
      // Inserta automáticamente el Authorization: Bearer <token>
      requestInterceptor: function (req) {
        try {
          const token =
            (typeof window !== "undefined" && window.sessionStorage.getItem("authToken")) ||
            (typeof window !== "undefined" && window.localStorage.getItem("authToken"));
          if (token && !req.headers["Authorization"]) {
            req.headers["Authorization"] = `Bearer ${token}`;
          }
        } catch (e) {
          // no-op
        }
        return req;
      },
      // Captura tokens en respuestas (p.ej., /auth/login, /auth/clientSession)
      responseInterceptor: function (res) {
        try {
          const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
          const token = data && (data.token || (data.data && data.data.token));
          if (token && typeof window !== "undefined") {
            window.sessionStorage.setItem("authToken", token);
          }
        } catch (e) {
          // no-op
        }
        return res;
      },
    },
  })
);

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
