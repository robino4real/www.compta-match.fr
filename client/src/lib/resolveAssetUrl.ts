const DEFAULT_API_BASE_URL = "https://api.compta-match.fr";

const getApiBaseUrl = () => {
  const raw = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
  return raw.replace(/\/$/, "").replace(/\/api$/, "");
};

const normalizeUploadsHost = (url: string) => {
  return url.replace(/https?:\/\/(www\.)?compta-match\.fr\/uploads\//, `${getApiBaseUrl()}/uploads/`);
};

export function resolveAssetUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  const fixedLegacy = normalizeUploadsHost(trimmed);
  if (fixedLegacy.startsWith("http")) {
    return fixedLegacy;
  }

  if (fixedLegacy.startsWith("/uploads/")) {
    return `${getApiBaseUrl()}${fixedLegacy}`;
  }

  return fixedLegacy;
}
