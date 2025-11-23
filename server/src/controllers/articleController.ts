import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const listPublishedArticles = async (_req: Request, res: Response) => {
  const articles = await prisma.article.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' } });
  res.json(articles);
};

export const adminListArticles = async (_req: Request, res: Response) => {
  const articles = await prisma.article.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(articles);
};

export const createArticle = async (req: Request, res: Response) => {
  const article = await prisma.article.create({ data: req.body });
  res.status(201).json(article);
};

export const updateArticle = async (req: Request, res: Response) => {
  const { id } = req.params;
  const article = await prisma.article.update({ where: { id }, data: req.body });
  res.json(article);
};

export const deleteArticle = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.article.delete({ where: { id } });
  res.status(204).send();
};
