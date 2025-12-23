import cors from "cors";
import { ALLOWED_ORIGINS, ANY_ORIGIN } from "../config.js";

const ACCEPTED_ORIGINS = ALLOWED_ORIGINS ? ALLOWED_ORIGINS.split(",") : [];
const ANY_ORIGIN_BOOLEAN = ANY_ORIGIN === "true";

export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) =>
  cors({
    origin: (origin, callback) => {
      if (ANY_ORIGIN_BOOLEAN) {
        return callback(null, true);
      }
      if (acceptedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (!origin) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy: Origin not allowed"));
    },
  });
