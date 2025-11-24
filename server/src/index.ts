import express from 'express';
import { env } from './config/env';
import healthRoutes from './routes/healthRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());
app.use('/api', healthRoutes);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Serveur ComptaMatch démarré sur le port ${env.port}`);
});
