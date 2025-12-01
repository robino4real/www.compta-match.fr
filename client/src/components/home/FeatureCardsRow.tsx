import { layout, typography } from "../../design/tokens";
import { HomepageSettingsDTO } from "../../types/homepage";

type FeatureCardsRowProps = Pick<HomepageSettingsDTO, "featureCards">;

export function FeatureCardsRow({ featureCards }: FeatureCardsRowProps) {
  if (!featureCards || featureCards.length === 0) return null;

  return (
    <section className="mt-12 md:mt-16 grid gap-4 md:grid-cols-3">
      {featureCards.map((card) => (
        <article
          key={card.title + card.iconKey}
          className={`${layout.cardSurface} px-5 py-6 flex flex-col gap-3 border border-slate-100`}
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
            {card.iconKey.toUpperCase().slice(0, 3)}
          </div>
          <h3 className={typography.featureTitle}>{card.title}</h3>
          <p className={typography.featureDescription}>{card.description}</p>
        </article>
      ))}
    </section>
  );
}
