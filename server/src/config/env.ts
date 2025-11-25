import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://USER:PASSWORD@localhost:5432/comptamatch_saas?schema=public',
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000'
};
