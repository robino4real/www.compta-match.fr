import { layout, typography } from "../../design/tokens";
import { FeatureIconKey } from "../../types/homepage";

type FeatureIconProps = {
  iconKey: FeatureIconKey;
};

export function FeatureIcon({ iconKey }: FeatureIconProps) {
  const baseClasses = "h-6 w-6 stroke-[1.8]";

  switch (iconKey) {
    case "apps":
      return (
        <svg
          viewBox="0 0 24 24"
          className={baseClasses}
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
        </svg>
      );
    case "pricing":
      return (
        <svg
          viewBox="0 0 24 24"
          className={baseClasses}
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="7" cy="7" r="3" />
          <path d="M4 20h10" />
          <path d="M14 4l6 6-8 8H6l-2-2v-6z" />
        </svg>
      );
    case "support":
      return (
        <svg
          viewBox="0 0 24 24"
          className={baseClasses}
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M9 10a3 3 0 0 1 6 0c0 2-3 2-3 4" />
          <circle cx="12" cy="17" r="1" />
        </svg>
      );
    case "security":
      return (
        <svg
          viewBox="0 0 24 24"
          className={baseClasses}
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3 5 6v6c0 4 2.5 7 7 9 4.5-2 7-5 7-9V6z" />
          <path d="M9 12a3 3 0 0 1 6 0v1.5" />
          <circle cx="12" cy="16" r="1" />
        </svg>
      );
    case "automation":
      return (
        <svg
          viewBox="0 0 24 24"
          className={baseClasses}
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M5 12h2" />
          <path d="M17 12h2" />
          <path d="M12 5v2" />
          <path d="M12 17v2" />
          <path d="M7.5 7.5 9 9" />
          <path d="M15 15l1.5 1.5" />
          <path d="M15 9l1.5-1.5" />
          <path d="M7.5 16.5 9 15" />
        </svg>
      );
    case "custom":
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          className={baseClasses}
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
        </svg>
      );
  }
}

type FeatureCard = {
  iconKey: FeatureIconKey;
  title: string;
  description: string;
};

type FeatureCardsRowProps = {
  cards: FeatureCard[];
};

export function FeatureCardsRow({ cards }: FeatureCardsRowProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <section className="mt-12 md:mt-16 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.title + card.iconKey}
          className={`${layout.cardSurface} px-5 py-6 flex flex-col gap-3 border border-slate-100 min-h-[150px]`}
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-800">
            <FeatureIcon iconKey={card.iconKey} />
          </div>
          <h3 className={typography.featureTitle}>{card.title}</h3>
          <p className={typography.featureDescription}>{card.description}</p>
        </article>
      ))}
    </section>
  );
}
