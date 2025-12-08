import "dotenv/config";
export const {
  PORT = process.env.PORT,
  DATABASE_URL = process.env.DATABASE_URL,
  DIRECT_URL = process.env.DIRECT_URL,
  NODE_ENV = process.env.NODE_ENV,
  ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS,
} = process.env;