import { useState } from "react";
import { typography } from "../../design/tokens";
import { HomepageSettingsDTO } from "../../types/homepage";

type NavbarProps = Pick<HomepageSettingsDTO, "logoText" | "logoSquareText" | "navLinks" | "primaryNavButton">;

export function MainNavbar({ logoText, logoSquareText, navLinks, primaryNavButton }: NavbarProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 md:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black text-xs font-semibold text-white">
              {logoSquareText || "CM"}
            </div>
            <span className="text-sm md:text-base font-semibold text-slate-900">{logoText || "ComptaMatch"}</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-6">
              {navLinks?.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={typography.navLink}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            {primaryNavButton && (
              <a
                href={primaryNavButton.href}
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition"
              >
                {primaryNavButton.label}
              </a>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setIsMobileNavOpen((v) => !v)}
            className="md:hidden inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
            aria-expanded={isMobileNavOpen}
          >
            Menu
          </button>
        </div>

        {isMobileNavOpen && (
          <div className="md:hidden mt-3 border-t border-slate-100 pt-3 space-y-2">
            {navLinks?.map((link) => (
              <a key={link.href} href={link.href} className="block text-sm text-slate-700 py-1">
                {link.label}
              </a>
            ))}
            {primaryNavButton && (
              <a
                href={primaryNavButton.href}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800"
              >
                {primaryNavButton.label}
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
