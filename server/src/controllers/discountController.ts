import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const listActiveDiscounts = async (_req: Request, res: Response) => {
  const discounts = await prisma.discountCode.findMany({ where: { active: true } });
  res.json(discounts);
};

export const adminListDiscounts = async (_req: Request, res: Response) => {
  const discounts = await prisma.discountCode.findMany();
  res.json(discounts);
};

export const createDiscount = async (req: Request, res: Response) => {
  const discount = await prisma.discountCode.create({ data: req.body });
  res.status(201).json(discount);
};

export const updateDiscount = async (req: Request, res: Response) => {
  const { id } = req.params;
  const discount = await prisma.discountCode.update({ where: { id }, data: req.body });
  res.json(discount);
};

export const deleteDiscount = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.discountCode.delete({ where: { id } });
  res.status(204).send();
};
