import React from "react";
import { MainNavbar } from "../components/layout/MainNavbar";
import { useHomepageSettings } from "../hooks/useHomepageSettings";
import Footer from "../components/Footer";
import { useLocation } from "react-router-dom";
import { resolveAssetUrl } from "../lib/resolveAssetUrl";
import CartAdditionToast from "../components/cart/CartAdditionToast";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { data } = useHomepageSettings();

  const normalizedPathname = React.useMemo(() => {
    try {
      return decodeURIComponent(location.pathname);
    } catch (error) {
      return location.pathname;
    }
  }, [location.pathname]);

  const isLogicielsPage = React.useMemo(
    () => normalizedPathname.startsWith("/logiciels"),
    [normalizedPathname]
  );

  const pageClassName = React.useMemo(() => {
    if (normalizedPathname === "/comptapro") return "page-comptapro";
    if (normalizedPathname === "/comptasso") return "page-comptasso";
    if (isLogicielsPage) return "page-logiciels";
    return "";
  }, [isLogicielsPage, normalizedPathname]);

  const showGradientSeparator = React.useMemo(
    () =>
      normalizedPathname === "/comptapro" ||
      normalizedPathname === "/comptasso" ||
      isLogicielsPage,
    [isLogicielsPage, normalizedPathname]
  );

  const isSubscriptionLanding = React.useMemo(
    () =>
      normalizedPathname.startsWith("/comptapro") ||
      normalizedPathname.startsWith("/comptasso") ||
      isLogicielsPage ||
      normalizedPathname.startsWith("/découverte") ||
      normalizedPathname.startsWith("/decouverte") ||
      normalizedPathname.startsWith("/d%C3%A9couverte"),
    [isLogicielsPage, normalizedPathname]
  );

  React.useEffect(() => {
    const faviconCandidate =
      data.branding?.faviconUrl?.trim() || data.branding?.navbarLogoUrl?.trim();
    const resolvedFavicon = resolveAssetUrl(faviconCandidate);
    if (!resolvedFavicon) return;

    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    link.href = resolvedFavicon;
  }, [data.branding?.faviconUrl, data.branding?.navbarLogoUrl]);

  return (
    <div
      className={["min-h-screen flex flex-col bg-white", pageClassName, "relative"]
        .filter(Boolean)
        .join(" ")}
    >
      <CartAdditionToast />
      {!isSubscriptionLanding && <MainNavbar />}
      <main className={["flex-1", showGradientSeparator ? "hero-wrapper" : ""].filter(Boolean).join(" ")}>{children}</main>
      {!isSubscriptionLanding && <Footer />}
    </div>
  );
};

export default MainLayout;
