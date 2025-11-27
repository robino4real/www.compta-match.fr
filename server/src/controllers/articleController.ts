import { Prisma, ArticleStatus } from "@prisma/client";
import { Request, Response } from "express";
import {
  createArticle,
  getArticleById,
  getPublishedArticleBySlug,
  listArticles,
  listRecentPublishedArticles,
  updateArticle,
} from "../services/articleService";
import { getStructuredDataForPage } from "../utils/structuredData";
import { getOrCreateSeoSettings } from "../services/seoSettingsService";
import { getOrCreateCompanySettings } from "../services/companySettingsService";
import { getOrCreateEmailSettings } from "../services/emailSettingsService";

function parseStatus(value?: string | null) {
  if (!value) return undefined;
  const upper = value.toUpperCase();
  if (upper === "DRAFT") return ArticleStatus.DRAFT;
  if (upper === "PUBLISHED") return ArticleStatus.PUBLISHED;
  if (upper === "ARCHIVED") return ArticleStatus.ARCHIVED;
  return undefined;
}

export async function adminListArticles(req: Request, res: Response) {
  const { status, category, search } = req.query as {
    status?: string;
    category?: string;
    search?: string;
  };

  try {
    const articles = await listArticles({
      status: parseStatus(status),
      category: category?.trim() || undefined,
      search: search?.trim() || undefined,
    });

    return res.json({ articles });
  } catch (error) {
    console.error("Erreur lors du chargement des articles", error);
    return res
      .status(500)
      .json({ message: "Impossible de récupérer les articles." });
  }
}

export async function adminGetArticle(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const article = await getArticleById(id);
    if (!article) {
      return res.status(404).json({ message: "Article introuvable." });
    }

    return res.json({ article });
  } catch (error) {
    console.error("Erreur lors de la récupération d'un article", error);
    return res
      .status(500)
      .json({ message: "Impossible de récupérer cet article." });
  }
}

function normalizeIncomingPayload(body: any) {
  const status = parseStatus(body?.status) ?? ArticleStatus.DRAFT;
  const readTime = body?.readTimeMinutes;
  const readTimeMinutes =
    typeof readTime === "number"
      ? readTime
      : readTime
      ? Number(readTime)
      : null;

  return {
    title: body?.title?.trim?.(),
    slug: body?.slug?.trim?.(),
    authorName: body?.authorName?.trim?.() || null,
    category: body?.category?.trim?.() || null,
    excerpt: body?.excerpt?.trim?.() || null,
    coverImageUrl: body?.coverImageUrl?.trim?.() || null,
    readTimeMinutes,
    content: body?.content ?? "",
    seoTitle: body?.seoTitle?.trim?.() || null,
    seoDescription: body?.seoDescription?.trim?.() || null,
    index:
      typeof body?.index === "boolean"
        ? body.index
        : body?.index === "false"
        ? false
        : true,
    follow:
      typeof body?.follow === "boolean"
        ? body.follow
        : body?.follow === "false"
        ? false
        : true,
    ogImageUrl: body?.ogImageUrl?.trim?.() || null,
    status,
  };
}

export async function adminCreateArticle(req: Request, res: Response) {
  const payload = normalizeIncomingPayload(req.body);

  if (!payload.title) {
    return res.status(400).json({ message: "Le titre est requis." });
  }

  if (!payload.slug) {
    return res.status(400).json({ message: "Le slug est requis." });
  }

  if (payload.status === ArticleStatus.PUBLISHED && !payload.content) {
    return res
      .status(400)
      .json({ message: "Le contenu doit être renseigné pour publier." });
  }

  try {
    const article = await createArticle(payload);
    return res.status(201).json({
      article,
      message: "Article créé avec succès.",
    });
  } catch (error: any) {
    console.error("Erreur lors de la création de l'article", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "Un article avec ce slug existe déjà.",
        });
      }
    }
    return res.status(500).json({
      message: "Impossible de créer cet article pour le moment.",
    });
  }
}

export async function adminUpdateArticle(req: Request, res: Response) {
  const { id } = req.params;
  const payload = normalizeIncomingPayload(req.body);

  if (!payload.title) {
    return res.status(400).json({ message: "Le titre est requis." });
  }

  if (!payload.slug) {
    return res.status(400).json({ message: "Le slug est requis." });
  }

  if (payload.status === ArticleStatus.PUBLISHED && !payload.content) {
    return res
      .status(400)
      .json({ message: "Le contenu doit être renseigné pour publier." });
  }

  try {
    const updated = await updateArticle(id, payload);
    if (!updated) {
      return res.status(404).json({ message: "Article introuvable." });
    }

    return res.json({ article: updated, message: "Article mis à jour." });
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de l'article", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "Un article avec ce slug existe déjà.",
        });
      }
    }
    return res.status(500).json({
      message: "Impossible de mettre à jour cet article pour le moment.",
    });
  }
}

export async function publicListArticles(req: Request, res: Response) {
  const { category, search } = req.query as { category?: string; search?: string };

  try {
    const articles = await listArticles({
      publishedOnly: true,
      category: category?.trim() || undefined,
      search: search?.trim() || undefined,
    });

    const [seoSettings, companySettings, emailSettings] = await Promise.all([
      getOrCreateSeoSettings(),
      getOrCreateCompanySettings(),
      getOrCreateEmailSettings(),
    ]);

    const structuredData = await getStructuredDataForPage({
      type: "articles-list",
      seoSettings,
      companySettings,
      emailSettings,
      canonicalPath: "/articles",
      breadcrumbItems: [
        { name: "Accueil", path: "/" },
        { name: "Articles", path: "/articles" },
      ],
    });

    return res.json({ articles, structuredData });
  } catch (error) {
    console.error("Erreur lors du chargement public des articles", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger les articles pour le moment." });
  }
}

export async function publicGetArticle(req: Request, res: Response) {
  const { slug } = req.params;

  try {
    const article = await getPublishedArticleBySlug(slug);
    if (!article) {
      return res.status(404).json({ message: "Article introuvable." });
    }

    const recent = await listRecentPublishedArticles(3, article.id);

    const [seoSettings, companySettings, emailSettings] = await Promise.all([
      getOrCreateSeoSettings(),
      getOrCreateCompanySettings(),
      getOrCreateEmailSettings(),
    ]);

    const structuredData = await getStructuredDataForPage({
      type: "article",
      seoSettings,
      companySettings,
      emailSettings,
      article,
      canonicalPath: `/articles/${article.slug}`,
      breadcrumbItems: [
        { name: "Accueil", path: "/" },
        { name: "Articles", path: "/articles" },
        { name: article.title, path: `/articles/${article.slug}` },
      ],
    });

    return res.json({ article, recent, structuredData });
  } catch (error) {
    console.error("Erreur lors du chargement d'un article", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger cet article pour le moment." });
  }
}
