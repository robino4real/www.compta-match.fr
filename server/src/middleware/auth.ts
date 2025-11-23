import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Non authentifié' });
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { id: string; role: string };
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session invalide' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' });
  next();
};
