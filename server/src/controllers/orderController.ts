import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export const createOrder = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Non authentifié' });
  const { items } = req.body as { items: { productId: string; quantity: number; unitPrice: number }[] };
  const totalAmount = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const order = await prisma.order.create({
    data: {
      userId,
      totalAmount,
      items: { create: items.map((item) => ({ ...item })) }
    },
    include: { items: true }
  });
  await prisma.userDownload.createMany({ data: items.map((i) => ({ userId, productId: i.productId })) });
  res.status(201).json(order);
};
