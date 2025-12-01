import { typography } from "../../design/tokens";
import { HomepageSettingsDTO } from "../../types/homepage";

type HeroProps = Pick<
  HomepageSettingsDTO,
  "heroTitle" | "heroSubtitle" | "heroPrimaryCtaLabel" | "heroPrimaryCtaHref" | "heroIllustrationUrl"
>;

export function HeroSection({
  heroTitle,
  heroSubtitle,
  heroPrimaryCtaHref,
  heroPrimaryCtaLabel,
  heroIllustrationUrl,
}: HeroProps) {
  return (
    <section className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
      <div className="space-y-6">
        <h1 className={typography.heroTitle}>{heroTitle}</h1>
        <p className={typography.heroSubtitle}>{heroSubtitle}</p>
        <div>
          <a
            href={heroPrimaryCtaHref}
            className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition"
          >
            {heroPrimaryCtaLabel}
          </a>
        </div>
      </div>

      <div className="flex justify-center md:justify-end">
        <div className="relative w-full max-w-md rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
          {heroIllustrationUrl ? (
            <img src={heroIllustrationUrl} alt="" className="w-full h-full object-contain p-6" />
          ) : (
            <div className="p-6 text-sm text-slate-400">Illustration à renseigner dans le back-office.</div>
          )}
        </div>
      </div>
    </section>
  );
}
