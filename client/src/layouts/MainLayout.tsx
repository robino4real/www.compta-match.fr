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
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isSubscriptionLanding ? (
        <header className="px-4 pt-6 pb-2 lg:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <button
              type="button"
              onClick={handleBackClick}
              className="group inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-md ring-1 ring-purple-200/70 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-600/80 to-fuchsia-500/80 text-white shadow-inner transition group-hover:from-purple-600 group-hover:to-fuchsia-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-4 w-4"
                >
                  <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="leading-none">Retour</span>
            </button>

            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-purple-700 lg:text-sm">
              Comptamatch
            </span>
          </div>
        </header>
      ) : (
        <MainNavbar />
      )}
      <main className={["flex-1", showGradientSeparator ? "hero-wrapper" : ""].filter(Boolean).join(" ")}>{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
