import express from 'express';
// @ts-ignore - Le typage de cookie-parser n'est pas fourni dans ce projet
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import healthRoutes from './routes/healthRoutes';
import adminRoutes from './routes/adminRoutes';
import { attachUserToRequest, requireAdmin, requireAuth } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errorHandler';
import orderRoutes from './routes/orderRoutes';

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/admin', attachUserToRequest, requireAdmin, adminRoutes);
app.use('/orders', attachUserToRequest, requireAuth, orderRoutes);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Serveur ComptaMatch démarré sur le port ${env.port}`);
});
