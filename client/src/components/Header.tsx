import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useClientAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Header: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors pb-1 border-b-2 border-transparent ${
      isActive ? "text-black border-black font-semibold" : "text-slate-700 hover:text-black"
    }`;

  const { user, isLoading, logout } = useClientAuth();
  const { items } = useCart();
  const [isNavOpen, setIsNavOpen] = React.useState(false);
  const { pathname } = useLocation();
  const navbarLogo = "/images/logo.png";

  const hideAuthAndCartButtons = React.useMemo(
    () => pathname === "/comptapro" || pathname === "/comptasso",
    [pathname]
  );

  const handleLogout = async () => {
    try {
      await logout("/");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsNavOpen(false);
    }
  };

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-4 min-w-0">
            <div className="leading-tight min-w-0">
              <div className="text-4xl font-semibold tracking-tight text-black truncate md:text-6xl">
                COMPTAMATCH
              </div>
              <div className="text-xs text-slate-500 truncate">
                L'aide à la comptabilité des TPE au meilleur prix.
              </div>
            </div>
            <img
              src={navbarLogo}
              alt="Logo ComptaMatch"
              className="h-24 w-auto flex-shrink-0 md:h-28"
            />
          </Link>

        <div className="flex items-center gap-2 md:hidden">
          {!hideAuthAndCartButtons && (
            <Link
              to="/panier"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 hover:border-black hover:text-black"
              aria-label="Panier"
              onClick={() => setIsNavOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-5 w-5"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 12.39a1 1 0 0 0 .98.8h8.72a1 1 0 0 0 .98-.8L21 6H6" strokeWidth={1.6} />
              </svg>
              {items.length > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                  {items.length}
                </span>
              )}
            </Link>
          )}
          {user && !isLoading && (
            <Link
              to="/compte"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 hover:border-black hover:text-black"
              aria-label="Espace client"
            >
              {user.email?.charAt(0).toUpperCase() || "A"}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setIsNavOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 hover:border-black hover:text-black"
            aria-label="Ouvrir le menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        </div>

        <div
          className={`mt-4 flex-col gap-4 md:mt-3 md:flex md:flex-row md:items-center md:justify-between ${
            isNavOpen ? "flex" : "hidden md:flex"
          }`}
        >
          <nav
            className="flex flex-col gap-2 md:flex-row md:items-center md:justify-center md:gap-4"
            aria-label="Navigation principale"
          >
            <NavLink to="/logiciels" className={navLinkClass}>
              Nos logiciels
            </NavLink>
            <NavLink to="/comptapro" className={navLinkClass}>
              ComptaPro
            </NavLink>
            <NavLink to="/comptasso" className={navLinkClass}>
              ComptAsso
            </NavLink>
          </nav>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
            {!user || isLoading ? (
              <>
                {!hideAuthAndCartButtons && (
                  <Link
                    to="/auth/login"
                    className="flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-black hover:text-black"
                    aria-label="Se connecter"
                  >
                    Se connecter
                  </Link>
                )}
                {!hideAuthAndCartButtons && (
                  <Link
                    to="/panier"
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 hover:border-black hover:text-black"
                    aria-label="Panier"
                    onClick={() => setIsNavOpen(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 12.39a1 1 0 0 0 .98.8h8.72a1 1 0 0 0 .98-.8L21 6H6" strokeWidth={1.6} />
                    </svg>
                    {items.length > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                        {items.length}
                      </span>
                    )}
                  </Link>
                )}
              </>
            ) : (
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Link
                  to="/compte"
                  className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black transition"
                  onClick={() => setIsNavOpen(false)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[12px] font-semibold text-white">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span>Mon compte</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-300 hover:border-black hover:text-black"
                >
                  Se déconnecter
                </button>
                {!hideAuthAndCartButtons && (
                  <Link
                    to="/panier"
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 hover:border-black hover:text-black"
                    aria-label="Panier"
                    onClick={() => setIsNavOpen(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 12.39a1 1 0 0 0 .98.8h8.72a1 1 0 0 0 .98-.8L21 6H6" strokeWidth={1.6} />
                    </svg>
                    {items.length > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                        {items.length}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
