const appendApiSuffix = (value: string) => {
  const normalized = value.replace(/\/$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

const normalizePath = (path: string) => {
  const prefixed = path.startsWith("/") ? path : `/${path}`;
  return prefixed.replace(/\/+/g, "/");
};

const DEFAULT_API_BASE_URL = "https://api.compta-match.fr";

const inferBaseUrl = () => {
  const base = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
  return appendApiSuffix(base);
};

export const API_BASE_URL = inferBaseUrl();

export const buildApiUrl = (path: string) => `${API_BASE_URL}${normalizePath(path)}`;
