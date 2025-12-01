import { typography } from "../../design/tokens";
import { HomepageSettingsDTO } from "../../types/homepage";

type NavbarProps = Pick<HomepageSettingsDTO, "logoText" | "logoSquareText" | "navLinks" | "primaryNavButton">;

export function MainNavbar({ logoText, logoSquareText, navLinks, primaryNavButton }: NavbarProps) {
  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:py-5">
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
      </div>
    </header>
  );
}
