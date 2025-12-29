import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import {
  createClientQuestion,
  getAdminClientQuestionById,
  listAdminClientQuestions,
  listPublishedFaqEntries,
  publishClientQuestion,
  unpublishClientQuestion,
  updateClientQuestionAnswer,
} from "../services/clientQuestionService";

export async function publicGetPublishedFaq(_req: Request, res: Response) {
  try {
    const items = await listPublishedFaqEntries();
    return res.json({ ok: true, data: { items } });
  } catch (error) {
    console.error("Erreur lors du chargement de la FAQ", error);
    return res
      .status(500)
      .json({ ok: false, message: "Impossible de charger la FAQ pour le moment." });
  }
}

export async function clientCreateQuestion(req: AuthenticatedRequest, res: Response) {
  const question = req.body?.question?.trim?.();
  const subject = req.body?.subject?.trim?.();

  if (!question || question.length < 10 || question.length > 2000) {
    return res.status(400).json({
      ok: false,
      message: "La question doit contenir entre 10 et 2000 caractères.",
    });
  }

  if (subject && subject.length > 120) {
    return res.status(400).json({
      ok: false,
      message: "Le sujet ne doit pas dépasser 120 caractères.",
    });
  }

  if (!req.user) {
    return res.status(401).json({ ok: false, message: "Authentification requise." });
  }

  if (req.user.role === "admin") {
    return res
      .status(403)
      .json({ ok: false, message: "Seuls les comptes clients peuvent poser une question." });
  }

  try {
    await createClientQuestion({
      userId: req.user.id,
      subject: subject || null,
      question,
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement d'une question client", error);
    return res
      .status(500)
      .json({ ok: false, message: "Impossible d'enregistrer la question pour le moment." });
  }
}

export async function adminListClientQuestions(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(req.query.pageSize) || 20));
  const search = (req.query.search as string | undefined)?.trim();

  try {
    const result = await listAdminClientQuestions({ page, pageSize, search });
    return res.json({ ok: true, data: result });
  } catch (error) {
    console.error("Erreur lors du listing des questions client", error);
    return res
      .status(500)
      .json({ ok: false, message: "Impossible de récupérer les questions pour le moment." });
  }
}

export async function adminGetClientQuestion(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const question = await getAdminClientQuestionById(id);
    if (!question) {
      return res.status(404).json({ ok: false, message: "Question introuvable." });
    }

    return res.json({ ok: true, data: question });
  } catch (error) {
    console.error("Erreur lors du chargement d'une question client", error);
    return res
      .status(500)
      .json({ ok: false, message: "Impossible de récupérer la question pour le moment." });
  }
}

export async function adminUpdateClientQuestion(req: Request, res: Response) {
  const { id } = req.params;
  const answerRaw = req.body?.answer as string | undefined;
  const normalizedAnswer = answerRaw?.trim?.() || null;

  try {
    const question = await updateClientQuestionAnswer(id, normalizedAnswer);
    return res.json({ ok: true, data: question, message: "Réponse enregistrée." });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la question client", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Question introuvable." });
    }
    return res.status(500).json({ ok: false, message: "Impossible d'enregistrer la réponse." });
  }
}

export async function adminPublishClientQuestion(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const question = await getAdminClientQuestionById(id);
    if (!question) {
      return res.status(404).json({ ok: false, message: "Question introuvable." });
    }

    if (!question.answer || question.answer.trim().length === 0) {
      return res
        .status(400)
        .json({ ok: false, message: "Une réponse est requise avant publication." });
    }

    const updated = await publishClientQuestion(id);
    return res.json({ ok: true, data: updated, message: "Question publiée." });
  } catch (error) {
    console.error("Erreur lors de la publication de la question client", error);
    return res.status(500).json({ ok: false, message: "Impossible de publier la réponse." });
  }
}

export async function adminUnpublishClientQuestion(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const updated = await unpublishClientQuestion(id);
    return res.json({ ok: true, data: updated, message: "Question dépubliée." });
  } catch (error) {
    console.error("Erreur lors de la dépublication de la question client", error);
    return res.status(500).json({ ok: false, message: "Impossible de dépublier la réponse." });
  }
}
