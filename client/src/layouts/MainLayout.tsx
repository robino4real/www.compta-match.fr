import React from "react";
import { MainNavbar } from "../components/layout/MainNavbar";
import { useHomepageSettings } from "../hooks/useHomepageSettings";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { settings } = useHomepageSettings();

  React.useEffect(() => {
    const faviconCandidate = settings.faviconUrl?.trim() || settings.navbarLogoUrl?.trim();
    if (!faviconCandidate) return;

    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    link.href = faviconCandidate;
  }, [settings.faviconUrl, settings.navbarLogoUrl]);

  return (
    <div className="min-h-screen bg-white">
      <MainNavbar />
      <main>{children}</main>
    </div>
  );
};

export default MainLayout;
