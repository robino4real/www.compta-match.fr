import { buildApiUrl } from "../config/api";
import { apiFetch } from "../lib/api";

export type ApiResponse<T> = {
  ok: boolean;
  data: T;
  message?: string;
};

export interface SeoSettingsResponse {
  id: string;
  singletonKey: string;
  siteName: string | null;
  defaultTitle: string | null;
  defaultDescription: string | null;
  defaultOgImageUrl: string | null;
  canonicalBaseUrl: string | null;
  defaultRobotsIndex: boolean;
  defaultRobotsFollow: boolean;
  robotsTxt: string | null;
  sitemapEnabled: boolean;
  sitemapIncludePages: boolean;
  sitemapIncludeProducts: boolean;
  sitemapIncludeArticles: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeoIdentityResponse {
  id: string;
  singletonKey: string;
  shortDescription: string | null;
  longDescription: string | null;
  targetAudience: string | null;
  positioning: string | null;
  differentiation: string | null;
  brandTone: string | null;
  language: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeoFaqItemResponse {
  id: string;
  order: number;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeoAnswerResponse {
  id: string;
  order: number;
  question: string;
  shortAnswer: string | null;
  longAnswer: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageSeoResponse {
  id: string;
  pageId: string;
  title: string | null;
  description: string | null;
  ogImageUrl: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean | null;
  robotsFollow: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSeoResponse {
  id: string;
  productId: string;
  title: string | null;
  description: string | null;
  ogImageUrl: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean | null;
  robotsFollow: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export type DiagnosticLevel = "ok" | "warning" | "error";

export interface DiagnosticAction {
  label: string;
  href?: string;
}

export interface DiagnosticCheck {
  id: string;
  category: string;
  level: DiagnosticLevel;
  title: string;
  message: string;
  action?: DiagnosticAction;
  meta?: Record<string, unknown>;
}

export interface DiagnosticsResponse {
  generatedAt: string;
  summary: {
    errors: number;
    warnings: number;
    ok: number;
  };
  checks: DiagnosticCheck[];
}

export async function fetchSeoSettings() {
  return apiFetch<ApiResponse<SeoSettingsResponse>>(buildApiUrl("/admin/seo-settings"));
}

export async function updateSeoSettings(payload: Partial<SeoSettingsResponse>) {
  return apiFetch<ApiResponse<SeoSettingsResponse>>(buildApiUrl("/admin/seo-settings"), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchGeoIdentity() {
  return apiFetch<ApiResponse<GeoIdentityResponse>>(buildApiUrl("/admin/geo-identity"));
}

export async function updateGeoIdentity(payload: Partial<GeoIdentityResponse>) {
  return apiFetch<ApiResponse<GeoIdentityResponse>>(buildApiUrl("/admin/geo-identity"), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchGeoFaq() {
  return apiFetch<ApiResponse<GeoFaqItemResponse[]>>(buildApiUrl("/admin/geo-faq"));
}

export async function createGeoFaqItem(payload: Partial<GeoFaqItemResponse>) {
  return apiFetch<ApiResponse<GeoFaqItemResponse>>(buildApiUrl("/admin/geo-faq"), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateGeoFaqItem(id: string, payload: Partial<GeoFaqItemResponse>) {
  return apiFetch<ApiResponse<GeoFaqItemResponse>>(buildApiUrl(`/admin/geo-faq/${id}`), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteGeoFaqItem(id: string) {
  return apiFetch<ApiResponse<null>>(buildApiUrl(`/admin/geo-faq/${id}`), {
    method: "DELETE",
  });
}

export async function reorderGeoFaq(ids: string[]) {
  return apiFetch<ApiResponse<GeoFaqItemResponse[]>>(buildApiUrl("/admin/geo-faq/reorder"), {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });
}

export async function fetchGeoAnswers() {
  return apiFetch<ApiResponse<GeoAnswerResponse[]>>(buildApiUrl("/admin/geo-answers"));
}

export async function createGeoAnswer(payload: Partial<GeoAnswerResponse>) {
  return apiFetch<ApiResponse<GeoAnswerResponse>>(buildApiUrl("/admin/geo-answers"), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateGeoAnswer(id: string, payload: Partial<GeoAnswerResponse>) {
  return apiFetch<ApiResponse<GeoAnswerResponse>>(buildApiUrl(`/admin/geo-answers/${id}`), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteGeoAnswer(id: string) {
  return apiFetch<ApiResponse<null>>(buildApiUrl(`/admin/geo-answers/${id}`), {
    method: "DELETE",
  });
}

export async function reorderGeoAnswers(ids: string[]) {
  return apiFetch<ApiResponse<GeoAnswerResponse[]>>(buildApiUrl("/admin/geo-answers/reorder"), {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });
}

export async function fetchPageSeo(pageId: string) {
  return apiFetch<ApiResponse<PageSeoResponse | null>>(buildApiUrl(`/admin/page-seo/${pageId}`));
}

export async function updatePageSeo(pageId: string, payload: Partial<PageSeoResponse>) {
  return apiFetch<ApiResponse<PageSeoResponse>>(buildApiUrl(`/admin/page-seo/${pageId}`), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchProductSeo(productId: string) {
  return apiFetch<ApiResponse<ProductSeoResponse | null>>(buildApiUrl(`/admin/product-seo/${productId}`));
}

export async function updateProductSeo(
  productId: string,
  payload: Partial<ProductSeoResponse>
) {
  return apiFetch<ApiResponse<ProductSeoResponse>>(buildApiUrl(`/admin/product-seo/${productId}`), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function runSeoGeoDiagnostics() {
  return apiFetch<ApiResponse<DiagnosticsResponse>>(buildApiUrl("/admin/seo-geo/diagnostics"));
}
