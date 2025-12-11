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

  const isDarkPage = React.useMemo(
    () =>
      location.pathname.startsWith("/comptapro") ||
      location.pathname.startsWith("/comptasso"),
    [location.pathname]
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
      className={
        isDarkPage
          ? "min-h-screen flex flex-col bg-[#050316]"
          : "min-h-screen flex flex-col bg-white"
      }
    >
      <MainNavbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
