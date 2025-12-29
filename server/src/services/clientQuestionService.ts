import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

function sanitizeString(value?: string | null, options?: { emptyAsNull?: boolean }) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return options?.emptyAsNull ? null : "";
  return trimmed;
}

export async function createClientQuestion(data: {
  userId: string;
  subject?: string | null;
  question: string;
}) {
  return prisma.clientQuestion.create({
    data: {
      userId: data.userId,
      subject: sanitizeString(data.subject, { emptyAsNull: true }),
      question: data.question.trim(),
      answer: null,
      published: false,
    },
  });
}

export async function listPublishedFaqEntries() {
  return prisma.clientQuestion.findMany({
    where: { published: true, answer: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      question: true,
      answer: true,
      createdAt: true,
    },
  });
}

export interface AdminQuestionListOptions {
  page: number;
  pageSize: number;
  search?: string;
}

export async function listAdminClientQuestions(options: AdminQuestionListOptions) {
  const { page, pageSize, search } = options;
  const where: Prisma.ClientQuestionWhereInput = {};

  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { question: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.clientQuestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { id: true, email: true } } },
    }),
    prisma.clientQuestion.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      subject: item.subject,
      questionPreview:
        item.question.length > 140
          ? `${item.question.slice(0, 137).trim()}...`
          : item.question,
      published: item.published,
      hasAnswer: Boolean(item.answer),
      user: item.user,
    })),
    total,
    page,
    pageSize,
  };
}

export async function getAdminClientQuestionById(id: string) {
  return prisma.clientQuestion.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true } } },
  });
}

export async function updateClientQuestionAnswer(id: string, answer: string | null) {
  return prisma.clientQuestion.update({
    where: { id },
    data: { answer: answer?.trim?.() || null },
  });
}

export async function publishClientQuestion(id: string) {
  return prisma.clientQuestion.update({
    where: { id },
    data: { published: true },
  });
}

export async function unpublishClientQuestion(id: string) {
  return prisma.clientQuestion.update({
    where: { id },
    data: { published: false },
  });
}
