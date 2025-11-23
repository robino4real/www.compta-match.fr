import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const listProducts = async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({ where: { active: true } });
  res.json(products);
};

export const adminListProducts = async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany();
  res.json(products);
};

export const createProduct = async (req: Request, res: Response) => {
  const product = await prisma.product.create({ data: req.body });
  res.status(201).json(product);
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await prisma.product.update({ where: { id }, data: req.body });
  res.json(product);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.product.delete({ where: { id } });
  res.status(204).send();
};
