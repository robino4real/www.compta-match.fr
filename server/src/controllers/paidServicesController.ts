import { PaidServiceType, Prisma } from "@prisma/client";
import { Request, Response } from "express";
import {
  createFeatureRow,
  createPlan,
  createSection,
  deleteFeatureRow,
  deletePlan,
  deleteSection,
  listAllPlans,
  listAllSections,
  listFeatureRows,
  listPublishedPlans,
  listPublishedSections,
  updateFeatureRow,
  updatePlan,
  updateSection,
} from "../services/paidServicesService";

function parseBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function parseNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function parsePrice(value: unknown) {
  if (value instanceof Prisma.Decimal) return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const normalized = Number(value.replace(",", "."));
    if (!Number.isNaN(normalized)) return normalized;
  }
  return null;
}

function parseServiceType(value: unknown): PaidServiceType {
  if (typeof value === "string") {
    const upper = value.toUpperCase();
    if (upper === "COMPTASSO") return "COMPTASSO";
  }
  if (value === "COMPTASSO") return "COMPTASSO";
  return "COMPTAPRO";
}

export async function publicListPaidServicePlans(req: Request, res: Response) {
  try {
    const serviceType = parseServiceType(req.query.serviceType);
    const plans = await listPublishedPlans(serviceType);
    return res.json(plans);
  } catch (error) {
    console.error("Erreur lors du chargement des plans publics", error);
    return res.status(500).json({ message: "Impossible de charger les abonnements." });
  }
}

export async function publicGetPaidServiceComparison(req: Request, res: Response) {
  try {
    const serviceType = parseServiceType(req.query.serviceType);
    const [plans, rows] = await Promise.all([listPublishedPlans(serviceType), listFeatureRows(serviceType)]);
    const columns = plans.slice(0, 2).map((plan) => ({ id: plan.id, name: plan.name, slug: plan.slug }));

    return res.json({
      plans: columns,
      rows: rows.map((row) => ({
        id: row.id,
        label: row.label,
        description: row.description,
        planAIncluded: row.planAIncluded,
        planBIncluded: row.planBIncluded,
      })),
    });
  } catch (error) {
    console.error("Erreur lors du chargement du comparatif public", error);
    return res.status(500).json({ message: "Impossible de charger le comparatif." });
  }
}

export async function publicListPaidServiceSections(req: Request, res: Response) {
  try {
    const serviceType = parseServiceType(req.query.serviceType);
    const sections = await listPublishedSections(serviceType);
    return res.json(
      sections.map((section) => ({
        id: section.id,
        title: section.title,
        body: section.body,
        imageUrl: section.imageUrl,
      }))
    );
  } catch (error) {
    console.error("Erreur lors du chargement des sections publiques", error);
    return res.status(500).json({ message: "Impossible de charger les contenus." });
  }
}

export async function adminListPaidServicePlans(req: Request, res: Response) {
  try {
    const serviceType = parseServiceType(req.query.serviceType);
    const plans = await listAllPlans(serviceType);
    return res.json({ plans });
  } catch (error) {
    console.error("Erreur lors de la récupération des plans", error);
    return res.status(500).json({ message: "Impossible de récupérer les plans." });
  }
}

export async function adminCreatePaidServicePlan(req: Request, res: Response) {
  const priceAmount = parsePrice(req.body?.priceAmount);
  if (!req.body?.name?.trim()) {
    return res.status(400).json({ message: "Le nom du plan est requis." });
  }
  if (!req.body?.slug?.trim()) {
    return res.status(400).json({ message: "Le slug du plan est requis." });
  }
  if (priceAmount === null) {
    return res.status(400).json({ message: "Le prix du plan est invalide." });
  }
  if (!req.body?.priceCurrency?.trim()) {
    return res.status(400).json({ message: "La devise est requise." });
  }
  if (!req.body?.pricePeriod?.trim()) {
    return res.status(400).json({ message: "La période est requise." });
  }

  try {
    const plan = await createPlan({
      name: req.body.name,
      slug: req.body.slug,
      subtitle: req.body.subtitle,
      priceAmount,
      priceCurrency: req.body.priceCurrency,
      pricePeriod: req.body.pricePeriod,
      isHighlighted: parseBoolean(req.body.isHighlighted, false),
      isPublished: parseBoolean(req.body.isPublished, false),
      sortOrder: parseNumber(req.body.sortOrder, 0),
      stripePriceId: req.body.stripePriceId,
      serviceType: parseServiceType(req.body.serviceType),
    });

    return res.status(201).json({ plan, message: "Plan créé." });
  } catch (error: any) {
    console.error("Erreur lors de la création du plan", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ message: "Un plan avec ce slug existe déjà." });
    }
    return res.status(500).json({ message: "Impossible de créer le plan." });
  }
}

export async function adminUpdatePaidServicePlan(req: Request, res: Response) {
  const { id } = req.params;
  const priceAmount = typeof req.body?.priceAmount === "undefined" ? undefined : parsePrice(req.body.priceAmount);

  if (priceAmount === null) {
    return res.status(400).json({ message: "Le prix du plan est invalide." });
  }

  try {
    const plan = await updatePlan(id, {
      name: req.body.name,
      slug: req.body.slug,
      subtitle: req.body.subtitle,
      priceAmount,
      priceCurrency: req.body.priceCurrency,
      pricePeriod: req.body.pricePeriod,
      isHighlighted:
        typeof req.body.isHighlighted === "undefined"
          ? undefined
          : parseBoolean(req.body.isHighlighted, false),
      isPublished:
        typeof req.body.isPublished === "undefined" ? undefined : parseBoolean(req.body.isPublished, false),
      sortOrder: typeof req.body.sortOrder === "undefined" ? undefined : parseNumber(req.body.sortOrder, 0),
      stripePriceId: req.body.stripePriceId,
      serviceType: typeof req.body.serviceType === "undefined" ? undefined : parseServiceType(req.body.serviceType),
    });

    if (!plan) {
      return res.status(404).json({ message: "Plan introuvable." });
    }

    return res.json({ plan, message: "Plan mis à jour." });
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du plan", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ message: "Un plan avec ce slug existe déjà." });
    }
    return res.status(500).json({ message: "Impossible de mettre à jour le plan." });
  }
}

export async function adminDeletePaidServicePlan(req: Request, res: Response) {
  const { id } = req.params;

  try {
    await deletePlan(id);
    return res.json({ message: "Plan supprimé." });
  } catch (error: any) {
    console.error("Erreur lors de la suppression du plan", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Plan introuvable." });
    }
    return res.status(500).json({ message: "Impossible de supprimer le plan." });
  }
}

export async function adminListPaidServiceFeatures(req: Request, res: Response) {
  try {
    const serviceType = parseServiceType(req.query.serviceType);
    const [plans, rows] = await Promise.all([listAllPlans(serviceType), listFeatureRows(serviceType)]);
    return res.json({ plans, rows });
  } catch (error) {
    console.error("Erreur lors du chargement des fonctionnalités", error);
    return res.status(500).json({ message: "Impossible de récupérer les fonctionnalités." });
  }
}

export async function adminCreatePaidServiceFeature(req: Request, res: Response) {
  if (!req.body?.label?.trim()) {
    return res.status(400).json({ message: "Le libellé est requis." });
  }

  try {
    const feature = await createFeatureRow({
      label: req.body.label,
      description: req.body.description,
      planAId: req.body.planAId,
      planBId: req.body.planBId,
      planAIncluded: parseBoolean(req.body.planAIncluded, false),
      planBIncluded: parseBoolean(req.body.planBIncluded, false),
      sortOrder: parseNumber(req.body.sortOrder, 0),
      serviceType: parseServiceType(req.body.serviceType),
    });

    return res.status(201).json({ feature, message: "Fonctionnalité créée." });
  } catch (error) {
    console.error("Erreur lors de la création de la fonctionnalité", error);
    return res.status(500).json({ message: "Impossible de créer la fonctionnalité." });
  }
}

export async function adminUpdatePaidServiceFeature(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const feature = await updateFeatureRow(id, {
      label: req.body.label,
      description: req.body.description,
      planAId: req.body.planAId,
      planBId: req.body.planBId,
      planAIncluded:
        typeof req.body.planAIncluded === "undefined" ? undefined : parseBoolean(req.body.planAIncluded, false),
      planBIncluded:
        typeof req.body.planBIncluded === "undefined" ? undefined : parseBoolean(req.body.planBIncluded, false),
      sortOrder: typeof req.body.sortOrder === "undefined" ? undefined : parseNumber(req.body.sortOrder, 0),
      serviceType: typeof req.body.serviceType === "undefined" ? undefined : parseServiceType(req.body.serviceType),
    });

    if (!feature) {
      return res.status(404).json({ message: "Fonctionnalité introuvable." });
    }

    return res.json({ feature, message: "Fonctionnalité mise à jour." });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la fonctionnalité", error);
    return res.status(500).json({ message: "Impossible de mettre à jour la fonctionnalité." });
  }
}

export async function adminDeletePaidServiceFeature(req: Request, res: Response) {
  const { id } = req.params;

  try {
    await deleteFeatureRow(id);
    return res.json({ message: "Fonctionnalité supprimée." });
  } catch (error: any) {
    console.error("Erreur lors de la suppression de la fonctionnalité", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Fonctionnalité introuvable." });
    }
    return res.status(500).json({ message: "Impossible de supprimer la fonctionnalité." });
  }
}

export async function adminListPaidServiceSections(req: Request, res: Response) {
  try {
    const serviceType = parseServiceType(req.query.serviceType);
    const sections = await listAllSections(serviceType);
    return res.json({ sections });
  } catch (error) {
    console.error("Erreur lors du chargement des sections", error);
    return res.status(500).json({ message: "Impossible de récupérer les sections." });
  }
}

export async function adminCreatePaidServiceSection(req: Request, res: Response) {
  if (!req.body?.title?.trim()) {
    return res.status(400).json({ message: "Le titre est requis." });
  }
  if (!req.body?.body) {
    return res.status(400).json({ message: "Le contenu est requis." });
  }

  try {
    const section = await createSection({
      title: req.body.title,
      body: req.body.body,
      imageUrl: req.body.imageUrl,
      sortOrder: parseNumber(req.body.sortOrder, 0),
      isPublished: parseBoolean(req.body.isPublished, true),
      serviceType: parseServiceType(req.body.serviceType),
    });

    return res.status(201).json({ section, message: "Section créée." });
  } catch (error) {
    console.error("Erreur lors de la création de la section", error);
    return res.status(500).json({ message: "Impossible de créer la section." });
  }
}

export async function adminUpdatePaidServiceSection(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const section = await updateSection(id, {
      title: req.body.title,
      body: req.body.body,
      imageUrl: req.body.imageUrl,
      sortOrder: typeof req.body.sortOrder === "undefined" ? undefined : parseNumber(req.body.sortOrder, 0),
      isPublished:
        typeof req.body.isPublished === "undefined" ? undefined : parseBoolean(req.body.isPublished, true),
      serviceType: typeof req.body.serviceType === "undefined" ? undefined : parseServiceType(req.body.serviceType),
    });

    if (!section) {
      return res.status(404).json({ message: "Section introuvable." });
    }

    return res.json({ section, message: "Section mise à jour." });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la section", error);
    return res.status(500).json({ message: "Impossible de mettre à jour la section." });
  }
}

export async function adminDeletePaidServiceSection(req: Request, res: Response) {
  const { id } = req.params;

  try {
    await deleteSection(id);
    return res.json({ message: "Section supprimée." });
  } catch (error: any) {
    console.error("Erreur lors de la suppression de la section", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Section introuvable." });
    }
    return res.status(500).json({ message: "Impossible de supprimer la section." });
  }
}
