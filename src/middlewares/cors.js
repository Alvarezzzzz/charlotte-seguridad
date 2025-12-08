import cors from 'cors';
import { ALLOWED_ORIGINS } from '../config.js';

const ACCEPTED_ORIGINS = ALLOWED_ORIGINS ? ALLOWED_ORIGINS.split(',') : [];

export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) => 
  cors({
    origin: (origin, callback) => {
      if (acceptedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (!origin) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Origin not allowed'));
    }
  });