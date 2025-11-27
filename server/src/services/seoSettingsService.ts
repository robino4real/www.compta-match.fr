import { Prisma, SeoSettings } from "@prisma/client";
import { prisma } from "../config/prisma";

const DEFAULT_SEO_SETTINGS: Omit<SeoSettings, "id" | "createdAt" | "updatedAt"> = {
  siteName: "ComptaMatch",
  siteTagline: null,
  defaultTitle: "ComptaMatch",
  titleTemplate: "{{pageTitle}} | {{siteName}}",
  defaultMetaDescription:
    "Solutions, ressources et logiciels téléchargeables pour simplifier la comptabilité des indépendants et TPE.",
  defaultOgImageUrl: null,
  twitterHandle: null,
  facebookPageUrl: null,
  linkedinPageUrl: null,
  indexSite: true,
  defaultRobotsIndex: "index",
  defaultRobotsFollow: "follow",
  canonicalBaseUrl: null,
  customRobotsTxt: null,
  enableSitemap: true,
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

export async function getOrCreateSeoSettings(): Promise<SeoSettings> {
  const existing = await prisma.seoSettings.findFirst();
  if (existing) return existing;

  return prisma.seoSettings.create({
    data: {
      id: 1,
      ...DEFAULT_SEO_SETTINGS,
    },
  });
}

export async function updateSeoSettings(
  payload: Partial<SeoSettings>
): Promise<SeoSettings> {
  const existing = await prisma.seoSettings.findFirst();
  const data: Prisma.SeoSettingsCreateInput = {
    siteName:
      sanitizeString(payload.siteName) ?? existing?.siteName ?? DEFAULT_SEO_SETTINGS.siteName,
    siteTagline:
      sanitizeString(payload.siteTagline) ?? existing?.siteTagline ?? DEFAULT_SEO_SETTINGS.siteTagline,
    defaultTitle:
      sanitizeString(payload.defaultTitle) ?? existing?.defaultTitle ?? DEFAULT_SEO_SETTINGS.defaultTitle,
    titleTemplate:
      sanitizeString(payload.titleTemplate) ?? existing?.titleTemplate ?? DEFAULT_SEO_SETTINGS.titleTemplate,
    defaultMetaDescription:
      sanitizeString(payload.defaultMetaDescription) ??
      existing?.defaultMetaDescription ??
      DEFAULT_SEO_SETTINGS.defaultMetaDescription,
    defaultOgImageUrl:
      sanitizeString(payload.defaultOgImageUrl) ?? existing?.defaultOgImageUrl ?? DEFAULT_SEO_SETTINGS.defaultOgImageUrl,
    twitterHandle:
      sanitizeString(payload.twitterHandle) ?? existing?.twitterHandle ?? DEFAULT_SEO_SETTINGS.twitterHandle,
    facebookPageUrl:
      sanitizeString(payload.facebookPageUrl) ?? existing?.facebookPageUrl ?? DEFAULT_SEO_SETTINGS.facebookPageUrl,
    linkedinPageUrl:
      sanitizeString(payload.linkedinPageUrl) ?? existing?.linkedinPageUrl ?? DEFAULT_SEO_SETTINGS.linkedinPageUrl,
    indexSite: sanitizeBoolean(payload.indexSite) ?? existing?.indexSite ?? DEFAULT_SEO_SETTINGS.indexSite,
    defaultRobotsIndex:
      sanitizeString(payload.defaultRobotsIndex) ??
      existing?.defaultRobotsIndex ??
      DEFAULT_SEO_SETTINGS.defaultRobotsIndex,
    defaultRobotsFollow:
      sanitizeString(payload.defaultRobotsFollow) ??
      existing?.defaultRobotsFollow ??
      DEFAULT_SEO_SETTINGS.defaultRobotsFollow,
    canonicalBaseUrl:
      sanitizeString(payload.canonicalBaseUrl) ?? existing?.canonicalBaseUrl ?? DEFAULT_SEO_SETTINGS.canonicalBaseUrl,
    customRobotsTxt:
      sanitizeString(payload.customRobotsTxt) ?? existing?.customRobotsTxt ?? DEFAULT_SEO_SETTINGS.customRobotsTxt,
    enableSitemap:
      sanitizeBoolean(payload.enableSitemap) ?? existing?.enableSitemap ?? DEFAULT_SEO_SETTINGS.enableSitemap,
  };

  if (!existing) {
    return prisma.seoSettings.create({ data: { id: 1, ...data } });
  }

  return prisma.seoSettings.update({
    where: { id: existing.id },
    data,
  });
}
