import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

export const register = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { firstName, lastName, email, passwordHash: hashed } });
  const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true });
  res.json({ user: { id: user.id, email: user.email, role: user.role } });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Identifiants invalides' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Identifiants invalides' });
  const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true });
  res.json({ user: { id: user.id, email: user.email, role: user.role } });
};

export const me = async (req: Request, res: Response) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Non authentifié' });
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: 'Session invalide' });
  }
};
