import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import articleRoutes from './routes/articleRoutes';
import discountRoutes from './routes/discountRoutes';
import { env } from './config/env';

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/discounts', discountRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Erreur serveur', details: err.message });
});

app.listen(env.port, () => {
  console.log(`API ComptaMatch démarrée sur le port ${env.port}`);
});
