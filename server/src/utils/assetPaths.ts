import { env } from "../config/env";

const LEGACY_HOSTS = ["https://compta-match.fr", "https://www.compta-match.fr"];
export const UPLOADS_PREFIX = "/uploads/";

const normalizeBaseUrl = (value?: string | null) =>
  (value || "").replace(/\/$/, "");

const knownUploadPrefixes = () => {
  const publicBase = normalizeBaseUrl(env.publicBaseUrl);
  const apiOrigin = normalizeBaseUrl(env.apiOrigin);

  return [
    ...LEGACY_HOSTS.map((host) => `${normalizeBaseUrl(host)}${UPLOADS_PREFIX}`),
    publicBase ? `${publicBase}${UPLOADS_PREFIX}` : null,
    apiOrigin ? `${apiOrigin}${UPLOADS_PREFIX}` : null,
  ].filter(Boolean) as string[];
};

export function normalizeUploadUrl(value?: string | null): string | null {
  if (typeof value !== "string") return value === null ? null : null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const prefixes = knownUploadPrefixes();
  for (const prefix of prefixes) {
    if (trimmed.startsWith(prefix)) {
      const relative = trimmed.slice(prefix.length);
      return `${UPLOADS_PREFIX}${relative}`;
    }
  }

  if (trimmed.startsWith(UPLOADS_PREFIX)) {
    return trimmed;
  }

  return trimmed;
}

export function buildPublicUploadUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedBase = normalizeBaseUrl(env.publicBaseUrl) || "https://api.compta-match.fr";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}
