const resolvePublicOrigin = () => {
  const envOrigin = import.meta.env.VITE_PUBLIC_ORIGIN as string | undefined;

  if (envOrigin) {
    return envOrigin.replace(/\/$/, "");
  }

  return window.location.origin;
};

const PUBLIC_APP_ORIGIN = resolvePublicOrigin();

export const buildPublicAppUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${PUBLIC_APP_ORIGIN}${normalizedPath}`;
};

export { PUBLIC_APP_ORIGIN };
