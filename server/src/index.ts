import express from 'express';
// @ts-ignore - Le typage de cookie-parser n'est pas fourni dans ce projet
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import healthRoutes from './routes/healthRoutes';
import adminRoutes from './routes/adminRoutes';
import { attachUserToRequest, requireAdmin, requireAuth } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errorHandler';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import downloadRoutes from './routes/downloadRoutes';
import cartRoutes from './routes/cartRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import legalPageRoutes from './routes/legalPageRoutes';
import articleRoutes from './routes/articleRoutes';

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/admin', attachUserToRequest, requireAdmin, adminRoutes);
app.use('/orders', attachUserToRequest, requireAuth, orderRoutes);
app.use('/payments', paymentRoutes);
app.use('/downloads', downloadRoutes);
app.use('/cart', cartRoutes);
app.use('/invoices', attachUserToRequest, requireAuth, invoiceRoutes);
app.use('/legal-pages', legalPageRoutes);
app.use('/articles', articleRoutes);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Serveur ComptaMatch démarré sur le port ${env.port}`);
});
