import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  stripeSecret: process.env.STRIPE_SECRET_KEY || 'sk_test_example',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_example'
};
