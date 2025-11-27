import { Article, DownloadableProduct, HomepageSettings, LegalPage, SeoSettings, SeoStaticPage } from "@prisma/client";

export type BuildSeoMetaOptions = {
  pageTitle?: string | null;
  metaDescription?: string | null;
  index?: boolean | null;
  follow?: boolean | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  canonicalUrlPath?: string | null;
  seoSettings: SeoSettings;
  fallbackOgImageUrl?: string | null;
};

export type SeoMetaResult = {
  title: string;
  description: string | null;
  robots: string;
  canonicalUrl: string | null;
  openGraph: {
    title: string;
    description: string | null;
    image: string | null;
    url: string | null;
    siteName: string;
  };
  twitter: {
    card: "summary" | "summary_large_image";
    title: string;
    description: string | null;
    image: string | null;
    site: string | null;
  };
};

function applyTitleTemplate(template: string | null | undefined, pageTitle: string, siteName: string) {
  if (!template) return pageTitle || siteName;
  return template
    .replace(/{{\s*pageTitle\s*}}/gi, pageTitle)
    .replace(/{{\s*siteName\s*}}/gi, siteName);
}

export function buildSeoMeta(options: BuildSeoMetaOptions): SeoMetaResult {
  const { seoSettings } = options;
  const baseTitle =
    options.pageTitle?.trim() ||
    options.metaDescription?.trim() ||
    seoSettings.defaultTitle ||
    seoSettings.siteName;

  const title = applyTitleTemplate(
    seoSettings.titleTemplate,
    baseTitle || seoSettings.siteName,
    seoSettings.siteName
  );

  const description =
    options.metaDescription?.trim() ||
    seoSettings.defaultMetaDescription ||
    null;

  const effectiveIndex = seoSettings.indexSite ? options.index ?? true : false;
  const effectiveFollow = seoSettings.indexSite ? options.follow ?? true : false;
  const robots = `${effectiveIndex ? "index" : "noindex"},${effectiveFollow ? "follow" : "nofollow"}`;

  const resolvedOgImage =
    options.ogImageUrl?.trim() ||
    options.fallbackOgImageUrl?.trim() ||
    seoSettings.defaultOgImageUrl?.trim() ||
    null;

  const canonicalUrl =
    seoSettings.canonicalBaseUrl && options.canonicalUrlPath
      ? `${seoSettings.canonicalBaseUrl.replace(/\/$/, "")}${options.canonicalUrlPath}`
      : null;

  const openGraph = {
    title,
    description,
    image: resolvedOgImage,
    url: canonicalUrl,
    siteName: seoSettings.siteName,
  };

  const twitter = {
    card: resolvedOgImage ? ("summary_large_image" as const) : ("summary" as const),
    title,
    description,
    image: resolvedOgImage,
    site: seoSettings.twitterHandle?.trim() || null,
  };

  return { title, description, robots, canonicalUrl, openGraph, twitter };
}

export function extractMetaFromArticle(article: Article) {
  return {
    pageTitle: article.seoTitle || article.title,
    metaDescription: article.seoDescription || article.excerpt || null,
    index: article.index,
    follow: article.follow,
    ogImageUrl: article.ogImageUrl || article.coverImageUrl || null,
  };
}

export function extractMetaFromProduct(product: DownloadableProduct) {
  return {
    pageTitle: product.seoTitle || product.name,
    metaDescription: product.seoDescription || product.shortDescription || null,
    index: product.index,
    follow: product.follow,
    ogImageUrl: product.ogImageUrl || null,
  };
}

export function extractMetaFromHomepage(settings: HomepageSettings) {
  return {
    pageTitle: settings.seoTitle || settings.heroTitle,
    metaDescription: settings.seoDescription || settings.heroSubtitle || null,
  };
}

export function extractMetaFromLegalPage(page: LegalPage) {
  return {
    pageTitle: page.seoTitle || page.title,
    metaDescription: page.seoDescription || null,
    index: page.index,
    follow: page.follow,
    ogImageUrl: page.ogImageUrl || null,
  };
}

export function extractMetaFromStaticPage(page: SeoStaticPage) {
  return {
    pageTitle: page.title,
    metaDescription: page.metaDescription,
    index: page.index,
    follow: page.follow,
    ogImageUrl: page.ogImageUrl || null,
  };
}
