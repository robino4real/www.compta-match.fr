import { Prisma, SeoStaticPage } from "@prisma/client";
import { prisma } from "../config/prisma";

export type SeoStaticPageKey =
  | "HOME_LISTING_ARTICLES"
  | "PRICING_PAGE"
  | "CONTACT_PAGE"
  | "DOWNLOADS_PAGE"
  | "ACCOUNT_PAGE";

const DEFAULT_STATIC_PAGES: Record<SeoStaticPageKey, Prisma.SeoStaticPageCreateInput> = {
  HOME_LISTING_ARTICLES: {
    key: "HOME_LISTING_ARTICLES",
    route: "/articles",
    title: "Articles ComptaMatch",
    metaDescription:
      "Parcourez les articles et guides publiés par ComptaMatch pour simplifier votre comptabilité.",
  },
  PRICING_PAGE: {
    key: "PRICING_PAGE",
    route: "/logiciels",
    title: "Logiciels ComptaMatch",
    metaDescription: "Découvrez les logiciels et tarifs des solutions ComptaMatch.",
  },
  CONTACT_PAGE: {
    key: "CONTACT_PAGE",
    route: "/contact",
    title: "Contact ComptaMatch",
    metaDescription: "Contactez l'équipe ComptaMatch pour toute question ou assistance.",
  },
  DOWNLOADS_PAGE: {
    key: "DOWNLOADS_PAGE",
    route: "/telechargements",
    title: "Téléchargements ComptaMatch",
    metaDescription: "Accédez à vos ressources et logiciels téléchargeables.",
  },
  ACCOUNT_PAGE: {
    key: "ACCOUNT_PAGE",
    route: "/mon-compte",
    title: "Espace client ComptaMatch",
    metaDescription: "Gérez vos informations et vos commandes depuis l'espace client.",
  },
};

function sanitizeString(value: unknown): string | null | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (value === null) return null;
  return undefined;
}

function sanitizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function ensureDefaultSeoStaticPages(): Promise<void> {
  const operations = Object.values(DEFAULT_STATIC_PAGES).map((page) =>
    prisma.seoStaticPage.upsert({
      where: { key: page.key },
      update: {},
      create: {
        ...page,
        index: true,
        follow: true,
      },
    })
  );
  await Promise.all(operations);
}

export async function listSeoStaticPages(): Promise<SeoStaticPage[]> {
  await ensureDefaultSeoStaticPages();
  return prisma.seoStaticPage.findMany({ orderBy: { route: "asc" } });
}

export async function updateSeoStaticPage(
  id: string,
  payload: Partial<SeoStaticPage>
): Promise<SeoStaticPage | null> {
  const existing = await prisma.seoStaticPage.findUnique({ where: { id } });
  if (!existing) return null;

  const data: Prisma.SeoStaticPageUpdateInput = {
    title: sanitizeString(payload.title) ?? existing.title,
    metaDescription: sanitizeString(payload.metaDescription) ?? existing.metaDescription,
    route: sanitizeString(payload.route) ?? existing.route,
    index: sanitizeBoolean(payload.index) ?? existing.index,
    follow: sanitizeBoolean(payload.follow) ?? existing.follow,
    ogImageUrl: sanitizeString(payload.ogImageUrl) ?? existing.ogImageUrl,
  };

  return prisma.seoStaticPage.update({
    where: { id },
    data,
  });
}
