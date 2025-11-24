import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export async function listUsers(_req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    return res.json({ users });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs', error);
    return res
      .status(500)
      .json({ message: 'Erreur lors de la récupération des utilisateurs.' });
  }
}
