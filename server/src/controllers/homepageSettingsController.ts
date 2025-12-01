import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import {
  getOrCreateHomepageSettings,
  updateHomepageSettings,
} from "../services/homepageSettingsService";
import { getOrCreateSeoSettings } from "../services/seoSettingsService";
import { getOrCreateCompanySettings } from "../services/companySettingsService";
import { getOrCreateEmailSettings } from "../services/emailSettingsService";
import { getStructuredDataForPage } from "../utils/structuredData";

function orderByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const orderMap = ids.reduce<Record<string, number>>((acc, id, index) => {
    acc[id] = index;
    return acc;
  }, {});

  return [...items].sort((a, b) => (orderMap[a.id] ?? 0) - (orderMap[b.id] ?? 0));
}

export async function adminGetHomepageSettings(_req: Request, res: Response) {
  try {
    const settings = await getOrCreateHomepageSettings();
    const availableProducts = await prisma.downloadableProduct.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return res.json({ settings, availableProducts });
  } catch (error) {
    console.error("Erreur lors du chargement de la home admin", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger les réglages de la home." });
  }
}

export async function adminSaveHomepageSettings(req: Request, res: Response) {
  try {
    const settings = await updateHomepageSettings(req.body || {});
    return res.json({ settings, message: "Page d'accueil mise à jour." });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la home", error);
    return res
      .status(500)
      .json({ message: "Impossible d'enregistrer la page d'accueil." });
  }
}

export async function publicGetHomepageSettings(_req: Request, res: Response) {
  try {
    const settings = await getOrCreateHomepageSettings();
    const highlightedIds = Array.isArray(settings.highlightedProductIds)
      ? (settings.highlightedProductIds as unknown[])
          .map((id) => (id == null ? null : String(id)))
          .filter((id): id is string => Boolean(id))
      : [];

    let highlightedProducts: any[] = [];
    if (highlightedIds.length > 0) {
      const products = await prisma.downloadableProduct.findMany({
        where: {
          id: { in: highlightedIds },
          isActive: true,
        },
      });

      highlightedProducts = orderByIds(products, highlightedIds);
    }

    const [seoSettings, companySettings, emailSettings] = await Promise.all([
      getOrCreateSeoSettings(),
      getOrCreateCompanySettings(),
      getOrCreateEmailSettings(),
    ]);

    const structuredData = await getStructuredDataForPage({
      type: "home",
      seoSettings,
      companySettings,
      emailSettings,
      canonicalPath: "/",
      breadcrumbItems: [{ name: "Accueil", path: "/" }],
    });

    return res.json({ settings, highlightedProducts, structuredData });
  } catch (error) {
    console.error("Erreur lors du chargement public de la home", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger la page d'accueil." });
  }
}

type HomepageSettingsDTO = {
  logoText: string;
  logoSquareText: string;
  navLinks: { label: string; href: string }[];
  primaryNavButton: { label: string; href: string } | null;
  heroTitle: string;
  heroSubtitle: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaHref: string;
  heroIllustrationUrl: string;
  featureCards: {
    iconKey: string;
    title: string;
    description: string;
  }[];
};

function normalizeNavLinks(value: unknown): { label: string; href: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      label: typeof item?.label === "string" ? item.label.trim() : "",
      href: typeof item?.href === "string" ? item.href.trim() : "",
    }))
    .filter((link) => link.label && link.href);
}

function normalizeFeatureCards(
  value: unknown
): { iconKey: string; title: string; description: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      iconKey: typeof item?.iconKey === "string" ? item.iconKey.trim() : "",
      title: typeof item?.title === "string" ? item.title.trim() : "",
      description: typeof item?.description === "string" ? item.description.trim() : "",
    }))
    .filter((card) => card.iconKey || card.title || card.description);
}

export async function publicGetHomepage(_req: Request, res: Response) {
  try {
    const settings = await getOrCreateHomepageSettings();

    const dto: HomepageSettingsDTO = {
      logoText: settings.logoText || "COMPTAMATCH",
      logoSquareText: settings.logoSquareText || "CM",
      navLinks:
        normalizeNavLinks(settings.navLinks) ||
        normalizeNavLinks([
          { label: "Comparer les offres", href: "/offres" },
          { label: "Nos logiciels", href: "/telechargements" },
          { label: "Contact", href: "/contact" },
        ]),
      primaryNavButton:
        typeof settings.primaryNavButton === "object" && settings.primaryNavButton
          ? {
              label:
                typeof (settings.primaryNavButton as any).label === "string"
                  ? (settings.primaryNavButton as any).label
                  : "Contact",
              href:
                typeof (settings.primaryNavButton as any).href === "string"
                  ? (settings.primaryNavButton as any).href
                  : "/contact",
            }
          : null,
      heroTitle: settings.heroTitle,
      heroSubtitle: settings.heroSubtitle,
      heroPrimaryCtaLabel: settings.heroPrimaryCtaLabel || settings.heroButtonLabel,
      heroPrimaryCtaHref: settings.heroPrimaryCtaHref || settings.heroButtonUrl,
      heroIllustrationUrl: settings.heroIllustrationUrl || settings.heroImageUrl || "",
      featureCards:
        normalizeFeatureCards(settings.featureCards) ||
        normalizeFeatureCards(settings.features) ||
        [],
    };

    return res.json(dto);
  } catch (error) {
    console.error("Erreur lors du chargement public de la home", error);
    return res
      .status(500)
      .json({ message: "Impossible de charger la page d'accueil." });
  }
}
