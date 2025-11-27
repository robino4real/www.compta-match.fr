import express from 'express';
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
import authRoutes from './routes/authRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import publicRoutes from './routes/publicRoutes';
import { ensureAdminAccount } from './services/adminAccountService';

const app = express();

app.use(express.json());

app.use('/api', healthRoutes);
app.use('/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/public', publicRoutes);
app.use('/admin', attachUserToRequest, requireAdmin, adminRoutes);
app.use('/orders', attachUserToRequest, requireAuth, orderRoutes);
app.use('/payments', paymentRoutes);
app.use('/downloads', downloadRoutes);
app.use('/cart', cartRoutes);
app.use('/invoices', attachUserToRequest, requireAuth, invoiceRoutes);
app.use('/legal-pages', legalPageRoutes);
app.use('/articles', articleRoutes);
app.use(errorHandler);

ensureAdminAccount().catch((error) => {
  console.error('[admin] Impossible de vérifier/créer le compte administrateur', error);
});

app.listen(env.port, () => {
  console.log(`Serveur ComptaMatch démarré sur le port ${env.port}`);
});
