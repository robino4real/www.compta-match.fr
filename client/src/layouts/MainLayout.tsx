import React from "react";
import { MainNavbar } from "../components/layout/MainNavbar";
import { useHomepageSettings } from "../hooks/useHomepageSettings";
import Footer from "../components/Footer";
import { useLocation } from "react-router-dom";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { data } = useHomepageSettings();

  const isLogicielsPage = React.useMemo(
    () => location.pathname.startsWith("/logiciels"),
    [location.pathname]
  );

  const pageClassName = React.useMemo(() => {
    if (location.pathname === "/comptapro") return "page-comptapro";
    if (location.pathname === "/comptasso") return "page-comptasso";
    if (isLogicielsPage) return "page-logiciels";
    return "";
  }, [isLogicielsPage, location.pathname]);

  const showGradientSeparator = React.useMemo(
    () =>
      location.pathname === "/comptapro" ||
      location.pathname === "/comptasso" ||
      isLogicielsPage,
    [isLogicielsPage, location.pathname]
  );

  const isSubscriptionLanding = React.useMemo(
    () =>
      location.pathname.startsWith("/comptapro") ||
      location.pathname.startsWith("/comptasso") ||
      isLogicielsPage,
    [isLogicielsPage, location.pathname]
  );

  React.useEffect(() => {
    const faviconCandidate = data.branding?.faviconUrl?.trim() || data.branding?.navbarLogoUrl?.trim();
    if (!faviconCandidate) return;

    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    link.href = faviconCandidate;
  }, [data.branding?.faviconUrl, data.branding?.navbarLogoUrl]);

  return (
    <div
      className={["min-h-screen flex flex-col bg-white", pageClassName, "relative"]
        .filter(Boolean)
        .join(" ")}
    >
      {!isSubscriptionLanding && <MainNavbar />}
      <main className={["flex-1", showGradientSeparator ? "hero-wrapper" : ""].filter(Boolean).join(" ")}>{children}</main>
      {!isSubscriptionLanding && <Footer />}
    </div>
  );
};

export default MainLayout;
