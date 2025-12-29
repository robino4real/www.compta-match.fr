import { BrandTone, CustomPage, DownloadableProduct, GeoAnswer, GeoFaqItem, GeoIdentity, PageSeo, Prisma, ProductSeo, SeoSettingsV2 } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ValidationError } from "./seoGeoAdminService";

export type AutofillMode = "FILL_ONLY_MISSING" | "OVERWRITE";

export type SeoGeoAutofillRequest = {
  includeGlobalSeo: boolean;
  includeGeoIdentity: boolean;
  includeGeoFaq: boolean;
  includeGeoAnswers: boolean;
  includePageSeo?: boolean;
  includeProductSeo?: boolean;
  mode?: AutofillMode;
};

export type SeoGeoAutofillApplyRequest = SeoGeoAutofillRequest & { confirm?: boolean };

type OptionalString = string | null | undefined;

export type AutofillSnapshot = {
  seoSettings?: SeoSettingsV2 | null;
  geoIdentity?: GeoIdentity | null;
  faqItems?: GeoFaqItem[];
  answers?: GeoAnswer[];
  pageSeo?: Array<PageSeo & { pageName?: string | null }>;
  productSeo?: Array<ProductSeo & { productName?: string | null }>;
  pages?: CustomPage[];
  products?: DownloadableProduct[];
};

export type AutofillDiff = {
  target: string;
  field: string;
  before: OptionalString | boolean | number | null | undefined;
  after: OptionalString | boolean | number | null | undefined;
};

const DEFAULT_BASE_URL = "https://www.compta-match.fr";
const DEFAULT_SITE_NAME = "ComptaMatch";
const DEFAULT_TITLE =
  "ComptaMatch — Logiciels de comptabilité simples pour indépendants, TPE et associations";
const DEFAULT_DESCRIPTION =
  "Solutions de comptabilité et de facturation adaptées aux indépendants, TPE et associations en France : suivi comptable, factures et documents conformes.";
const DEFAULT_SHORT_DESCRIPTION =
  "ComptaMatch édite des logiciels de comptabilité et de gestion pour indépendants, TPE et associations en France : compta, facturation et documents comptables.";
const DEFAULT_LONG_DESCRIPTION = [
  "ComptaMatch développe des logiciels dédiés aux besoins comptables des indépendants, TPE et associations.",
  "Chaque module privilégie la simplicité d'usage et la conformité française pour gérer facturation et documents.",
  "Les utilisateurs peuvent centraliser leurs pièces comptables et suivre leur activité sans complexité inutile.",
  "Les produits sont proposés en achat unique pour maîtriser les coûts sur le long terme.",
].join(" ");
const DEFAULT_FAQ: Array<Pick<GeoFaqItem, "question" | "answer">> = [
  {
    question: "Quel logiciel de comptabilité choisir pour une TPE ?",
    answer:
      "ComptaMatch propose des modules pensés pour les petites entreprises avec un pilotage clair des écritures et des documents. Choisissez le module qui correspond à vos besoins sans multiplier les outils.",
  },
  {
    question: "ComptaMatch est-il adapté aux associations ?",
    answer:
      "Oui, le module ComptAsso accompagne la tenue comptable associative avec des libellés et une présentation sobres. Les fonctionnalités essentielles sont privilégiées pour éviter la complexité inutile.",
  },
  {
    question: "Peut-on gérer la facturation et les documents comptables ?",
    answer:
      "Les modules ComptaMatch incluent la création de factures et l'organisation des documents comptables. Le focus est mis sur la clarté des pièces et leur conservation dans un espace privé.",
  },
  {
    question: "ComptaMatch est-il un logiciel de comptabilité en ligne ?",
    answer:
      "Les solutions ComptaMatch sont accessibles depuis votre espace client, avec des sauvegardes réalisées sur l'infrastructure de l'éditeur. Les données restent dédiées à votre organisation.",
  },
  {
    question: "Y a-t-il un abonnement ?",
    answer:
      "Les modules ComptaMatch sont proposés en achat unique pour limiter les coûts récurrents. Les mises à jour disponibles sont indiquées dans votre compte client lorsqu'elles concernent votre licence.",
  },
  {
    question: "Les données sont-elles sécurisées et privées ?",
    answer:
      "Chaque fiche client dispose d'un espace privé. Les accès sont réservés aux titulaires du compte et aux utilisateurs autorisés, avec un contrôle basique des droits. Les données ne sont pas partagées avec des tiers.",
  },
  {
    question: "ComptaMatch convient-il aux indépendants ?",
    answer:
      "Le module ComptaPro est pensé pour les indépendants qui veulent une comptabilité simple. Il aide à suivre les factures, les règlements et les documents sans devoir gérer un logiciel complexe.",
  },
  {
    question: "Comment gérer les mises à jour fonctionnelles ?",
    answer:
      "Les évolutions produit sont publiées dans votre espace client. Vous pouvez installer les nouvelles versions compatibles avec votre licence lorsque vous en avez besoin.",
  },
];

const DEFAULT_ANSWERS: Array<Pick<GeoAnswer, "question" | "shortAnswer" | "longAnswer">> = [
  {
    question: "Qu'est-ce que ComptaMatch ?",
    shortAnswer:
      "ComptaMatch édite des logiciels de comptabilité et de facturation dédiés aux indépendants, TPE et associations.",
    longAnswer:
      "ComptaMatch développe des modules ciblés sur la tenue comptable, la facturation et l'organisation des documents. L'approche privilégie la simplicité : interface épurée, peu d'étapes et une mise en place rapide. Chaque module est pensé pour répondre aux obligations courantes en France sans multiplier les options secondaires. Les données sont stockées dans un espace client dédié. Le modèle d'achat unique permet de maîtriser le budget. Les évolutions sont annoncées dans l'espace client et peuvent être déployées selon les besoins.",
  },
  {
    question: "À qui s'adresse ComptaPro ?",
    shortAnswer:
      "ComptaPro vise les indépendants et micro-entreprises qui veulent suivre factures et documents sans complexité.",
    longAnswer:
      "ComptaPro rassemble les fonctions essentielles pour les indépendants : facturation, suivi des règlements et organisation des pièces comptables. Le produit met en avant une navigation épurée pour aller vite sur les tâches courantes. Les exports et documents sont conçus pour rester conformes aux usages français. L'achat unique évite les abonnements récurrents et permet de conserver le contrôle sur les mises à jour. Les utilisateurs peuvent ainsi travailler avec un outil stable et clair.",
  },
  {
    question: "À qui s'adresse ComptAsso ?",
    shortAnswer:
      "ComptAsso est pensé pour les associations qui ont besoin d'un suivi comptable simple et d'un espace privé.",
    longAnswer:
      "ComptAsso accompagne les associations qui souhaitent centraliser leurs écritures et documents. L'outil met l'accent sur la clarté des libellés et la production de documents propres pour les rapports internes. Les responsables peuvent organiser les pièces justificatives et préparer leurs comptes annuels plus facilement. Le positionnement sans abonnement permet de limiter les coûts récurrents tout en conservant un logiciel dédié.",
  },
  {
    question: "Pourquoi choisir un achat unique plutôt qu'un abonnement ?",
    shortAnswer:
      "L'achat unique offre un coût maîtrisé et évite les frais mensuels récurrents sur la durée.",
    longAnswer:
      "Les modules ComptaMatch sont proposés en achat unique pour offrir une meilleure visibilité budgétaire. Ce modèle est adapté aux organisations qui préfèrent financer un outil stable et le conserver plusieurs années. Il évite les surcoûts d'abonnement et laisse la liberté d'installer les mises à jour compatibles avec la licence. Cette approche favorise aussi la maîtrise des données, qui restent dans l'espace privé associé au compte.",
  },
];

function normalizeString(value: OptionalString, fallback?: string, overwrite = false) {
  if (overwrite) {
    return (value ?? fallback ?? null)?.trim() || null;
  }
  if (value && value.trim().length > 0) return value.trim();
  if (fallback) return fallback;
  return value ?? null;
}

function buildRobots(baseUrl?: string | null) {
  const safeBase = (baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  return `User-agent: *\nAllow: /\nSitemap: ${safeBase || DEFAULT_BASE_URL}/sitemap.xml`;
}

function clipDescription(value: string, max = 175) {
  if (value.length <= max) return value;
  return value.slice(0, max).replace(/\s+\S*$/, "").trim();
}

function requireBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") {
    throw new ValidationError(`Champ ${field} invalide`, 400, "INVALID_BODY");
  }
  return value;
}

function computeDiff(
  before: Record<string, OptionalString | boolean | number | null | undefined>,
  after: Record<string, OptionalString | boolean | number | null | undefined>,
  target: string
): AutofillDiff[] {
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  return keys
    .filter((key) => before[key] !== after[key])
    .map((key) => ({ target, field: key, before: before[key], after: after[key] }));
}

async function fetchPages(): Promise<CustomPage[]> {
  return prisma.customPage.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" } });
}

async function fetchProducts(): Promise<DownloadableProduct[]> {
  return prisma.downloadableProduct.findMany({ where: { isActive: true, isArchived: false }, orderBy: { createdAt: "asc" } });
}

function proposeGlobalSeo(current: SeoSettingsV2 | null, mode: AutofillMode) {
  const overwrite = mode === "OVERWRITE";
  const canonicalBaseUrl = normalizeString(
    current?.canonicalBaseUrl,
    DEFAULT_BASE_URL,
    overwrite
  );
  const siteName = normalizeString(current?.siteName, DEFAULT_SITE_NAME, overwrite);
  const defaultTitle = normalizeString(current?.defaultTitle, DEFAULT_TITLE, overwrite);
  const defaultDescription = normalizeString(current?.defaultDescription, DEFAULT_DESCRIPTION, overwrite);
  const robotsTxt = normalizeString(
    current?.robotsTxt,
    buildRobots(canonicalBaseUrl || DEFAULT_BASE_URL),
    overwrite
  );

  const proposed: SeoSettingsV2 = {
    id: current?.id || "",
    singletonKey: "global",
    siteName,
    defaultTitle,
    defaultDescription: defaultDescription ? clipDescription(defaultDescription) : null,
    defaultOgImageUrl: overwrite ? current?.defaultOgImageUrl ?? null : current?.defaultOgImageUrl ?? null,
    canonicalBaseUrl,
    defaultRobotsIndex: overwrite ? true : current?.defaultRobotsIndex ?? true,
    defaultRobotsFollow: overwrite ? true : current?.defaultRobotsFollow ?? true,
    robotsTxt,
    sitemapEnabled: overwrite ? true : current?.sitemapEnabled ?? true,
    sitemapIncludePages: overwrite ? true : current?.sitemapIncludePages ?? true,
    sitemapIncludeProducts: overwrite ? true : current?.sitemapIncludeProducts ?? true,
    sitemapIncludeArticles: overwrite ? false : current?.sitemapIncludeArticles ?? false,
    createdAt: current?.createdAt || new Date(),
    updatedAt: current?.updatedAt || new Date(),
  };

  if (!overwrite) {
    if (current?.defaultOgImageUrl) {
      proposed.defaultOgImageUrl = current.defaultOgImageUrl;
    }
  }

  return proposed;
}

function proposeGeoIdentity(current: GeoIdentity | null, mode: AutofillMode) {
  const overwrite = mode === "OVERWRITE";
  const proposed: GeoIdentity = {
    id: current?.id || "",
    singletonKey: "global",
    shortDescription: normalizeString(current?.shortDescription, DEFAULT_SHORT_DESCRIPTION, overwrite),
    longDescription: normalizeString(current?.longDescription, DEFAULT_LONG_DESCRIPTION, overwrite),
    targetAudience: normalizeString(current?.targetAudience, "Indépendants, TPE, associations", overwrite),
    positioning: normalizeString(
      current?.positioning,
      "Logiciels simples, achat unique, orientés conformité française",
      overwrite
    ),
    differentiation: normalizeString(
      current?.differentiation,
      "Sans abonnement, interface épurée, modules spécialisés (ComptaPro, ComptAsso), espace privé par fiche.",
      overwrite
    ),
    brandTone: (overwrite ? BrandTone.PEDAGOGICAL : current?.brandTone || BrandTone.PEDAGOGICAL) as BrandTone,
    language: normalizeString(current?.language, "fr", overwrite) || "fr",
    createdAt: current?.createdAt || new Date(),
    updatedAt: current?.updatedAt || new Date(),
  };

  return proposed;
}

function proposeFaq(current: GeoFaqItem[], mode: AutofillMode) {
  if (current.length > 0 && mode !== "OVERWRITE") return current;
  return DEFAULT_FAQ.map((item, index) => ({
    id: "",
    order: index,
    question: item.question,
    answer: item.answer,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

function proposeAnswers(current: GeoAnswer[], mode: AutofillMode) {
  if (current.length > 0 && mode !== "OVERWRITE") return current;
  return DEFAULT_ANSWERS.map((item, index) => ({
    id: "",
    order: index,
    question: item.question,
    shortAnswer: item.shortAnswer,
    longAnswer: item.longAnswer,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

function summarizeContent(text?: string | null, fallback?: string) {
  if (!text) return fallback || null;
  return clipDescription(text.replace(/\s+/g, " ").trim());
}

function proposePageSeo(pages: CustomPage[], existing: PageSeo[]) {
  const existingByPageId = new Map(existing.map((p) => [p.pageId, p] as const));
  return pages.map((page) => {
    const override = existingByPageId.get(page.id);
    const title = `${page.name} | ${DEFAULT_SITE_NAME}`;
    const description = summarizeContent(override?.description, DEFAULT_DESCRIPTION);
    return {
      id: override?.id || "",
      pageId: page.id,
      title,
      description,
      ogImageUrl: override?.ogImageUrl ?? null,
      canonicalUrl: override?.canonicalUrl ?? null,
      robotsIndex: override?.robotsIndex ?? null,
      robotsFollow: override?.robotsFollow ?? null,
      jsonLdOverride: override?.jsonLdOverride ?? null,
      createdAt: override?.createdAt || new Date(),
      updatedAt: override?.updatedAt || new Date(),
      pageName: page.name,
    } as PageSeo & { pageName: string };
  });
}

function proposeProductSeo(products: DownloadableProduct[], existing: ProductSeo[]) {
  const existingByProductId = new Map(existing.map((p) => [p.productId, p] as const));
  return products.map((product) => {
    const override = existingByProductId.get(product.id);
    const title = `${product.name} | ${DEFAULT_SITE_NAME}`;
    const sourceDescription = override?.description || product.seoDescription || product.longDescription || product.shortDescription;
    const description = summarizeContent(sourceDescription, DEFAULT_DESCRIPTION);
    return {
      id: override?.id || "",
      productId: product.id,
      title,
      description,
      ogImageUrl: override?.ogImageUrl ?? product.ogImageUrl ?? null,
      canonicalUrl: override?.canonicalUrl ?? null,
      robotsIndex: override?.robotsIndex ?? product.index ?? null,
      robotsFollow: override?.robotsFollow ?? product.follow ?? null,
      createdAt: override?.createdAt || new Date(),
      updatedAt: override?.updatedAt || new Date(),
      productName: product.name,
    } as ProductSeo & { productName: string };
  });
}

async function loadCurrentSnapshot(options: SeoGeoAutofillRequest): Promise<AutofillSnapshot> {
  const snapshot: AutofillSnapshot = {};
  if (options.includeGlobalSeo) {
    snapshot.seoSettings = await prisma.seoSettingsV2.findUnique({ where: { singletonKey: "global" } });
  }
  if (options.includeGeoIdentity) {
    snapshot.geoIdentity = await prisma.geoIdentity.findUnique({ where: { singletonKey: "global" } });
  }
  if (options.includeGeoFaq) {
    snapshot.faqItems = await prisma.geoFaqItem.findMany({ orderBy: { order: "asc" } });
  }
  if (options.includeGeoAnswers) {
    snapshot.answers = await prisma.geoAnswer.findMany({ orderBy: { order: "asc" } });
  }
  if (options.includePageSeo) {
    const [pages, existingSeo] = await Promise.all([
      fetchPages(),
      prisma.pageSeo.findMany(),
    ]);
    const existingByPageId = new Map(existingSeo.map((item) => [item.pageId, item] as const));
    snapshot.pageSeo = pages.map((page) => {
      const override = existingByPageId.get(page.id);
      return {
        id: override?.id || "",
        pageId: page.id,
        title: override?.title ?? null,
        description: override?.description ?? null,
        ogImageUrl: override?.ogImageUrl ?? null,
        canonicalUrl: override?.canonicalUrl ?? null,
        robotsIndex: override?.robotsIndex ?? null,
        robotsFollow: override?.robotsFollow ?? null,
        jsonLdOverride: override?.jsonLdOverride ?? null,
        createdAt: override?.createdAt || new Date(),
        updatedAt: override?.updatedAt || new Date(),
        pageName: page.name,
      } as PageSeo & { pageName: string };
    });
    snapshot.pages = pages;
  }
  if (options.includeProductSeo) {
    const [products, existingSeo] = await Promise.all([
      fetchProducts(),
      prisma.productSeo.findMany(),
    ]);
    const existingByProductId = new Map(existingSeo.map((item) => [item.productId, item] as const));
    snapshot.productSeo = products.map((product) => {
      const override = existingByProductId.get(product.id);
      return {
        id: override?.id || "",
        productId: product.id,
        title: override?.title ?? null,
        description: override?.description ?? null,
        ogImageUrl: override?.ogImageUrl ?? product.ogImageUrl ?? null,
        canonicalUrl: override?.canonicalUrl ?? null,
        robotsIndex: override?.robotsIndex ?? product.index ?? null,
        robotsFollow: override?.robotsFollow ?? product.follow ?? null,
        createdAt: override?.createdAt || new Date(),
        updatedAt: override?.updatedAt || new Date(),
        productName: product.name,
      } as ProductSeo & { productName: string };
    });
    snapshot.products = products;
  }
  return snapshot;
}

export async function previewSeoGeoAutofill(options: SeoGeoAutofillRequest) {
  const normalizedOptions: SeoGeoAutofillRequest = {
    includeGlobalSeo: requireBoolean(options.includeGlobalSeo, "includeGlobalSeo"),
    includeGeoIdentity: requireBoolean(options.includeGeoIdentity, "includeGeoIdentity"),
    includeGeoFaq: requireBoolean(options.includeGeoFaq, "includeGeoFaq"),
    includeGeoAnswers: requireBoolean(options.includeGeoAnswers, "includeGeoAnswers"),
    includePageSeo:
      typeof options.includePageSeo === "boolean" ? options.includePageSeo : false,
    includeProductSeo:
      typeof options.includeProductSeo === "boolean" ? options.includeProductSeo : false,
    mode: options.mode,
  };

  const mode: AutofillMode = normalizedOptions.mode === "OVERWRITE" ? "OVERWRITE" : "FILL_ONLY_MISSING";
  const current = await loadCurrentSnapshot(normalizedOptions);

  const proposed: AutofillSnapshot = {};
  const diffs: AutofillDiff[] = [];

  if (options.includeGlobalSeo) {
    const proposedSeo = proposeGlobalSeo(current.seoSettings || null, mode);
    proposed.seoSettings = proposedSeo;
    diffs.push(
      ...computeDiff(
        {
          siteName: current.seoSettings?.siteName,
          defaultTitle: current.seoSettings?.defaultTitle,
          defaultDescription: current.seoSettings?.defaultDescription,
          defaultOgImageUrl: current.seoSettings?.defaultOgImageUrl,
          canonicalBaseUrl: current.seoSettings?.canonicalBaseUrl,
          defaultRobotsIndex: current.seoSettings?.defaultRobotsIndex,
          defaultRobotsFollow: current.seoSettings?.defaultRobotsFollow,
          robotsTxt: current.seoSettings?.robotsTxt,
          sitemapEnabled: current.seoSettings?.sitemapEnabled,
          sitemapIncludePages: current.seoSettings?.sitemapIncludePages,
          sitemapIncludeProducts: current.seoSettings?.sitemapIncludeProducts,
          sitemapIncludeArticles: current.seoSettings?.sitemapIncludeArticles,
        },
        {
          siteName: proposedSeo.siteName,
          defaultTitle: proposedSeo.defaultTitle,
          defaultDescription: proposedSeo.defaultDescription,
          defaultOgImageUrl: proposedSeo.defaultOgImageUrl,
          canonicalBaseUrl: proposedSeo.canonicalBaseUrl,
          defaultRobotsIndex: proposedSeo.defaultRobotsIndex,
          defaultRobotsFollow: proposedSeo.defaultRobotsFollow,
          robotsTxt: proposedSeo.robotsTxt,
          sitemapEnabled: proposedSeo.sitemapEnabled,
          sitemapIncludePages: proposedSeo.sitemapIncludePages,
          sitemapIncludeProducts: proposedSeo.sitemapIncludeProducts,
          sitemapIncludeArticles: proposedSeo.sitemapIncludeArticles,
        },
        "seoSettings"
      )
    );
  }

  if (options.includeGeoIdentity) {
    const proposedIdentity = proposeGeoIdentity(current.geoIdentity || null, mode);
    proposed.geoIdentity = proposedIdentity;
    diffs.push(
      ...computeDiff(
        {
          shortDescription: current.geoIdentity?.shortDescription,
          longDescription: current.geoIdentity?.longDescription,
          targetAudience: current.geoIdentity?.targetAudience,
          positioning: current.geoIdentity?.positioning,
          differentiation: current.geoIdentity?.differentiation,
          brandTone: current.geoIdentity?.brandTone,
          language: current.geoIdentity?.language,
        },
        {
          shortDescription: proposedIdentity.shortDescription,
          longDescription: proposedIdentity.longDescription,
          targetAudience: proposedIdentity.targetAudience,
          positioning: proposedIdentity.positioning,
          differentiation: proposedIdentity.differentiation,
          brandTone: proposedIdentity.brandTone,
          language: proposedIdentity.language,
        },
        "geoIdentity"
      )
    );
  }

  if (options.includeGeoFaq) {
    const proposedFaq = proposeFaq(current.faqItems || [], mode);
    proposed.faqItems = proposedFaq;
    if (mode === "OVERWRITE" || (current.faqItems || []).length === 0) {
      diffs.push({
        target: "geoFaq",
        field: "items",
        before: (current.faqItems || []).length,
        after: proposedFaq.length,
      });
    }
  }

  if (options.includeGeoAnswers) {
    const proposedAnswers = proposeAnswers(current.answers || [], mode);
    proposed.answers = proposedAnswers;
    if (mode === "OVERWRITE" || (current.answers || []).length === 0) {
      diffs.push({
        target: "geoAnswers",
        field: "items",
        before: (current.answers || []).length,
        after: proposedAnswers.length,
      });
    }
  }

  if (options.includePageSeo) {
    const proposedPageSeo = proposePageSeo(current.pages || [], current.pageSeo || []);
    proposed.pageSeo = proposedPageSeo;
    proposedPageSeo.forEach((item) => {
      const previous = (current.pageSeo || []).find((entry) => entry.pageId === item.pageId);
      diffs.push({
        target: `page:${item.pageName || item.pageId}`,
        field: "title",
        before: previous?.title,
        after: item.title,
      });
      diffs.push({
        target: `page:${item.pageName || item.pageId}`,
        field: "description",
        before: previous?.description,
        after: item.description,
      });
    });
  }

  if (options.includeProductSeo) {
    const proposedProductSeo = proposeProductSeo(current.products || [], current.productSeo || []);
    proposed.productSeo = proposedProductSeo;
    proposedProductSeo.forEach((item) => {
      const previous = (current.productSeo || []).find((entry) => entry.productId === item.productId);
      diffs.push({
        target: `product:${item.productName || item.productId}`,
        field: "title",
        before: previous?.title,
        after: item.title,
      });
      diffs.push({
        target: `product:${item.productName || item.productId}`,
        field: "description",
        before: previous?.description,
        after: item.description,
      });
    });
  }

  return { current, proposed, diff: diffs };
}

export async function applySeoGeoAutofill(options: SeoGeoAutofillApplyRequest) {
  const mode: AutofillMode = options.mode === "OVERWRITE" ? "OVERWRITE" : "FILL_ONLY_MISSING";
  if (mode === "OVERWRITE" && !options.confirm) {
    throw new ValidationError("Confirmation requise pour écraser les valeurs existantes", 400, "CONFIRMATION_REQUIRED");
  }

  const preview = await previewSeoGeoAutofill({ ...options, mode });

  const result = await prisma.$transaction(async (tx) => {
    const applied: AutofillSnapshot = {};

    if (options.includeGlobalSeo && preview.proposed.seoSettings) {
      const data: Prisma.SeoSettingsV2UncheckedCreateInput = {
        singletonKey: "global",
        siteName: preview.proposed.seoSettings.siteName,
        defaultTitle: preview.proposed.seoSettings.defaultTitle,
        defaultDescription: preview.proposed.seoSettings.defaultDescription,
        defaultOgImageUrl: preview.proposed.seoSettings.defaultOgImageUrl,
        canonicalBaseUrl: preview.proposed.seoSettings.canonicalBaseUrl,
        defaultRobotsIndex: preview.proposed.seoSettings.defaultRobotsIndex,
        defaultRobotsFollow: preview.proposed.seoSettings.defaultRobotsFollow,
        robotsTxt: preview.proposed.seoSettings.robotsTxt,
        sitemapEnabled: preview.proposed.seoSettings.sitemapEnabled,
        sitemapIncludePages: preview.proposed.seoSettings.sitemapIncludePages,
        sitemapIncludeProducts: preview.proposed.seoSettings.sitemapIncludeProducts,
        sitemapIncludeArticles: preview.proposed.seoSettings.sitemapIncludeArticles,
      };

      applied.seoSettings = await tx.seoSettingsV2.upsert({
        where: { singletonKey: "global" },
        update: data,
        create: data,
      });
    }

    if (options.includeGeoIdentity && preview.proposed.geoIdentity) {
      const data: Prisma.GeoIdentityUncheckedCreateInput = {
        singletonKey: "global",
        shortDescription: preview.proposed.geoIdentity.shortDescription,
        longDescription: preview.proposed.geoIdentity.longDescription,
        targetAudience: preview.proposed.geoIdentity.targetAudience,
        positioning: preview.proposed.geoIdentity.positioning,
        differentiation: preview.proposed.geoIdentity.differentiation,
        brandTone: preview.proposed.geoIdentity.brandTone,
        language: preview.proposed.geoIdentity.language,
      };

      applied.geoIdentity = await tx.geoIdentity.upsert({
        where: { singletonKey: "global" },
        update: data,
        create: data,
      });
    }

    if (options.includeGeoFaq && preview.proposed.faqItems) {
      if (mode === "OVERWRITE") {
        await tx.geoFaqItem.deleteMany();
      }
      if (mode === "OVERWRITE" || (preview.current.faqItems || []).length === 0) {
        applied.faqItems = await Promise.all(
          preview.proposed.faqItems.map((item, index) =>
            tx.geoFaqItem.create({
              data: { order: index, question: item.question, answer: item.answer },
            })
          )
        );
      } else {
        applied.faqItems = await tx.geoFaqItem.findMany({ orderBy: { order: "asc" } });
      }
    }

    if (options.includeGeoAnswers && preview.proposed.answers) {
      if (mode === "OVERWRITE") {
        await tx.geoAnswer.deleteMany();
      }
      if (mode === "OVERWRITE" || (preview.current.answers || []).length === 0) {
        applied.answers = await Promise.all(
          preview.proposed.answers.map((item, index) =>
            tx.geoAnswer.create({
              data: { order: index, question: item.question, shortAnswer: item.shortAnswer, longAnswer: item.longAnswer },
            })
          )
        );
      } else {
        applied.answers = await tx.geoAnswer.findMany({ orderBy: { order: "asc" } });
      }
    }

    if (options.includePageSeo && preview.proposed.pageSeo) {
      applied.pageSeo = [];
      for (const item of preview.proposed.pageSeo) {
        const data: Prisma.PageSeoUncheckedCreateInput = {
          pageId: item.pageId,
          title: item.title,
          description: item.description,
          ogImageUrl: item.ogImageUrl,
          canonicalUrl: item.canonicalUrl,
          robotsIndex: item.robotsIndex,
          robotsFollow: item.robotsFollow,
          jsonLdOverride: item.jsonLdOverride as Prisma.InputJsonValue,
        };
        const saved = await tx.pageSeo.upsert({
          where: { pageId: item.pageId },
          update: data,
          create: data,
        });
        applied.pageSeo.push(saved);
      }
    }

    if (options.includeProductSeo && preview.proposed.productSeo) {
      applied.productSeo = [];
      for (const item of preview.proposed.productSeo) {
        const data: Prisma.ProductSeoUncheckedCreateInput = {
          productId: item.productId,
          title: item.title,
          description: item.description,
          ogImageUrl: item.ogImageUrl,
          canonicalUrl: item.canonicalUrl,
          robotsIndex: item.robotsIndex,
          robotsFollow: item.robotsFollow,
        };
        const saved = await tx.productSeo.upsert({
          where: { productId: item.productId },
          update: data,
          create: data,
        });
        applied.productSeo.push(saved);
      }
    }

    return applied;
  });

  return { applied: result, proposed: preview.proposed, current: preview.current, diff: preview.diff };
}
