import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://USER:PASSWORD@localhost:5432/comptamatch_saas?schema=public'
};
