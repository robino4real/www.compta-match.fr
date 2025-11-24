import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // Basic error logging for development
  console.error(err);
  res.status(500).json({ message: 'Erreur interne du serveur', details: err.message });
}
