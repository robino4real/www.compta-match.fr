/**
 * Structured data helpers used to generate schema.org JSON-LD payloads
 * across the public pages. New types can be added by composing the
 * primitives below (Organization/WebSite, Article, Product, BreadcrumbList)
 * inside `getStructuredDataForPage` to keep the injection logic centralized.
 */
import {
  Article,
  CompanySettings,
  DownloadableProduct,
  EmailSettings,
  LegalPage,
  SeoSettings,
} from "@prisma/client";
import { getOrCreateCompanySettings } from "../services/companySettingsService";
import { getOrCreateEmailSettings } from "../services/emailSettingsService";
import { getOrCreateSeoSettings } from "../services/seoSettingsService";
import { stripHtmlTags } from "./strings";

const SCHEMA_CONTEXT = "https://schema.org";

export type BreadcrumbItem = { name: string; path: string };

export function getGlobalStructuredData(params: {
  seoSettings: SeoSettings;
  companySettings: CompanySettings;
  emailSettings?: EmailSettings;
  searchUrl?: string | null;
}): any[] {
  const { seoSettings, companySettings, emailSettings } = params;
  const sameAs = [
    seoSettings.facebookPageUrl,
    seoSettings.linkedinPageUrl,
    seoSettings.twitterHandle ? `https://twitter.com/${seoSettings.twitterHandle.replace(/^@/, "")}` : null,
  ].filter((value): value is string => Boolean(value));

  const supportEmail =
    companySettings.supportEmail || companySettings.contactEmail || emailSettings?.supportEmail || null;

  const organization = {
    "@context": SCHEMA_CONTEXT,
    "@type": "Organization",
    name: seoSettings.siteName || companySettings.companyName,
    url: seoSettings.canonicalBaseUrl || companySettings.websiteUrl || undefined,
    logo: companySettings.logoUrl || seoSettings.defaultOgImageUrl || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    contactPoint: supportEmail
      ? [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: supportEmail,
            availableLanguage: "French",
          },
        ]
      : undefined,
  };

  const webSite = {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    url: seoSettings.canonicalBaseUrl || companySettings.websiteUrl || undefined,
    name: seoSettings.siteName || companySettings.companyName,
    potentialAction: params.searchUrl
      ? {
          "@type": "SearchAction",
          target: `${params.searchUrl}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        }
      : undefined,
  };

  return [organization, webSite];
}

export function getArticleStructuredData(params: {
  seoSettings: SeoSettings;
  article: Article;
  canonicalPath?: string | null;
  companySettings: CompanySettings;
}): any[] {
  const { seoSettings, article, canonicalPath, companySettings } = params;
  const baseUrl = seoSettings.canonicalBaseUrl?.replace(/\/$/, "") || "";
  const url = canonicalPath ? `${baseUrl}${canonicalPath}` || undefined : undefined;
  const description =
    article.seoDescription || article.excerpt || (article.content ? stripHtmlTags(article.content).slice(0, 250) : "");
  const image = article.ogImageUrl || article.coverImageUrl || seoSettings.defaultOgImageUrl || undefined;

  const jsonLd = {
    "@context": SCHEMA_CONTEXT,
    "@type": "Article",
    headline: article.seoTitle || article.title,
    description: description || undefined,
    image,
    datePublished: article.publishedAt || undefined,
    dateModified: article.updatedAt || undefined,
    mainEntityOfPage: url
      ? {
          "@type": "WebPage",
          "@id": url,
        }
      : undefined,
    author: {
      "@type": "Organization",
      name: companySettings.companyName || seoSettings.siteName,
    },
    publisher: {
      "@type": "Organization",
      name: companySettings.companyName || seoSettings.siteName,
      logo: companySettings.logoUrl || seoSettings.defaultOgImageUrl || undefined,
    },
  };

  return [jsonLd];
}

export function getProductStructuredData(params: {
  seoSettings: SeoSettings;
  product: DownloadableProduct;
  canonicalPath?: string | null;
  companySettings: CompanySettings;
}): any[] {
  const { seoSettings, product, canonicalPath, companySettings } = params;
  const baseUrl = seoSettings.canonicalBaseUrl?.replace(/\/$/, "") || "";
  const url = canonicalPath ? `${baseUrl}${canonicalPath}` || undefined : undefined;
  const image = product.ogImageUrl || seoSettings.defaultOgImageUrl || undefined;

  const jsonLd = {
    "@context": SCHEMA_CONTEXT,
    "@type": "Product",
    name: product.seoTitle || product.name,
    description: product.seoDescription || product.shortDescription || product.longDescription || undefined,
    image,
    sku: product.id,
    brand: {
      "@type": "Organization",
      name: companySettings.companyName || seoSettings.siteName,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency || "EUR",
      price: product.priceCents != null ? (product.priceCents / 100).toFixed(2) : undefined,
      availability: "http://schema.org/InStock",
      url,
    },
  };

  return [jsonLd];
}

export function getBreadcrumbStructuredData(params: {
  seoSettings: SeoSettings;
  items: BreadcrumbItem[];
}): any | null {
  const { seoSettings, items } = params;
  if (!items || items.length === 0) return null;

  const baseUrl = seoSettings.canonicalBaseUrl?.replace(/\/$/, "");

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: baseUrl ? `${baseUrl}${item.path}` : item.path,
    })),
  };
}

export type StructuredDataParams = {
  type: "home" | "articles-list" | "article" | "product" | "legal";
  seoSettings?: SeoSettings;
  companySettings?: CompanySettings;
  emailSettings?: EmailSettings;
  article?: Article;
  product?: DownloadableProduct;
  legalPage?: LegalPage;
  canonicalPath?: string | null;
  breadcrumbItems?: BreadcrumbItem[];
};

export async function getStructuredDataForPage(params: StructuredDataParams): Promise<any[]> {
  const seoSettings = params.seoSettings || (await getOrCreateSeoSettings());
  const companySettings = params.companySettings || (await getOrCreateCompanySettings());
  const emailSettings = params.emailSettings || (await getOrCreateEmailSettings());

  const data: any[] = [];

  if (params.type === "home" || params.type === "articles-list" || params.type === "legal") {
    data.push(...getGlobalStructuredData({ seoSettings, companySettings, emailSettings }));
  }

  if (params.type === "article" && params.article) {
    data.push(...getArticleStructuredData({
      seoSettings,
      article: params.article,
      canonicalPath: params.canonicalPath,
      companySettings,
    }));
  }

  if (params.type === "product" && params.product) {
    data.push(
      ...getProductStructuredData({
        seoSettings,
        product: params.product,
        canonicalPath: params.canonicalPath,
        companySettings,
      })
    );
  }

  if (params.breadcrumbItems && params.breadcrumbItems.length > 0) {
    const breadcrumb = getBreadcrumbStructuredData({ seoSettings, items: params.breadcrumbItems });
    if (breadcrumb) {
      data.push(breadcrumb);
    }
  }

  return data;
}
