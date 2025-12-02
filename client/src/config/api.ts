const appendApiSuffix = (value: string) => {
  const normalized = value.replace(/\/$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

const normalizePath = (path: string) => {
  const prefixed = path.startsWith("/") ? path : `/${path}`;
  return prefixed.replace(/\/+/g, "/");
};

const inferBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return appendApiSuffix(import.meta.env.VITE_API_BASE_URL);
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return appendApiSuffix(window.location.origin);
  }

  return "http://localhost:4000/api";
};

export const API_BASE_URL = inferBaseUrl();

export const buildApiUrl = (path: string) => `${API_BASE_URL}${normalizePath(path)}`;
