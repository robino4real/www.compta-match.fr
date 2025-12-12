import React from "react";
import { MainNavbar } from "../components/layout/MainNavbar";
import { useHomepageSettings } from "../hooks/useHomepageSettings";
import Footer from "../components/Footer";
import { useLocation, useNavigate } from "react-router-dom";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = useHomepageSettings();

  const isDarkPage = React.useMemo(
    () =>
      location.pathname.startsWith("/comptapro") ||
      location.pathname.startsWith("/comptasso"),
    [location.pathname]
  );

  const pageClassName = React.useMemo(() => {
    if (location.pathname === "/comptapro") return "page-comptapro";
    if (location.pathname === "/comptasso") return "page-comptasso";
    return "";
  }, [location.pathname]);

  const showGradientSeparator = React.useMemo(
    () => location.pathname === "/comptapro" || location.pathname === "/comptasso",
    [location.pathname]
  );

  const isSubscriptionLanding = React.useMemo(
    () => location.pathname.startsWith("/comptapro") || location.pathname.startsWith("/comptasso"),
    [location.pathname]
  );

  const handleBackClick = React.useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [navigate]);

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
      className={[
        isDarkPage
          ? "min-h-screen flex flex-col bg-[#050316]"
          : "min-h-screen flex flex-col bg-white",
        pageClassName,
        "relative",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isSubscriptionLanding ? null : <MainNavbar />}

      {isSubscriptionLanding && (
        <div className="pointer-events-none absolute inset-x-0 top-4 flex items-center justify-between px-3 sm:px-4 md:px-6">
          <button
            type="button"
            onClick={handleBackClick}
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/5 text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Retour"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <span className="pointer-events-auto text-lg font-semibold tracking-tight text-white md:text-2xl">
            COMPTAMATCH
          </span>
        </div>
      )}
      <main className={["flex-1", showGradientSeparator ? "hero-wrapper" : ""].filter(Boolean).join(" ")}>{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
