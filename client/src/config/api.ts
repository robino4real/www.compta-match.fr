const appendApiSuffix = (value: string) => {
  const normalized = value.replace(/\/$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
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
