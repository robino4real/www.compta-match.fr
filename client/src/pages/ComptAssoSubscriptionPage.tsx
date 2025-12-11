import React from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { PaidServiceComparison, PaidServicePlan, PaidServiceSection } from "../types/paidServices";
import { formatPaidServicePrice } from "../lib/formatPaidServicePrice";
import TopNavGradient from "../components/layout/TopNavGradient";

const ComptAssoSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = React.useState<PaidServicePlan[]>([]);
  const [comparison, setComparison] = React.useState<PaidServiceComparison | null>(null);
  const [sections, setSections] = React.useState<PaidServiceSection[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const planSkeletons = React.useMemo(() => Array.from({ length: 2 }), []);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [plansRes, comparisonRes, sectionsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/paid-services/public/plans?serviceType=COMPTASSO`),
          fetch(`${API_BASE_URL}/paid-services/public/comparison?serviceType=COMPTASSO`),
          fetch(`${API_BASE_URL}/paid-services/public/sections?serviceType=COMPTASSO`),
        ]);

        if (!plansRes.ok) throw new Error("plans_error");
        if (!comparisonRes.ok) throw new Error("comparison_error");
        if (!sectionsRes.ok) throw new Error("sections_error");

        const plansData = (await plansRes.json()) as PaidServicePlan[];
        const comparisonData = (await comparisonRes.json()) as PaidServiceComparison;
        const sectionsData = (await sectionsRes.json()) as PaidServiceSection[];

        setPlans(plansData);
        setComparison(comparisonData);
        setSections(sectionsData);
      } catch (err) {
        console.error("Erreur lors du chargement de la page ComptAsso", err);
        setError("Une erreur est survenue, veuillez réessayer plus tard.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlanDetailClick = () => {
    navigate("/nouvelle-page");
  };

  const renderPlanCard = (plan: PaidServicePlan) => (
    <article
      key={plan.id}
      className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 px-6 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-200 ring-1 ring-emerald-300/30">
            ComptAsso
          </p>
          <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
          {plan.subtitle && <p className="text-sm text-slate-200/90">{plan.subtitle}</p>}
        </div>
        <p className="text-right text-lg font-semibold text-white">
          {formatPaidServicePrice(Number(plan.priceAmount), plan.priceCurrency)}
          <span className="text-sm text-slate-200"> /{plan.pricePeriod === "month" ? "mois" : "an"}</span>
        </p>
      </header>
      <button
        className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-md transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        type="button"
        onClick={handlePlanDetailClick}
      >
        En savoir plus
      </button>
    </article>
  );

  const renderPlanSkeleton = (index: number) => (
    <div
      key={`skeleton-${index}`}
      className="h-52 rounded-3xl border border-white/10 bg-white/10 animate-pulse"
    />
  );

  const renderComparisonSkeleton = () => (
    <div className="h-48 rounded-2xl border border-white/10 bg-white/10 animate-pulse" />
  );

  const renderSectionSkeleton = (index: number) => (
    <div key={`section-skeleton-${index}`} className="h-56 rounded-3xl bg-white/10 border border-white/10 animate-pulse" />
  );

  const hasPlans = plans.length > 0;

  return (
    <main className="relative isolate min-h-screen overflow-visible bg-[#050316] text-white">
      <TopNavGradient />
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-pink-500/20 blur-[100px]" />
        <div className="absolute right-0 top-10 h-96 w-96 rounded-full bg-purple-600/25 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black via-black/70 to-transparent" />
      </div>

      <div className="relative z-20 mx-auto max-w-6xl px-4 pb-20 pt-16 lg:px-8 lg:pt-20 space-y-12">
        <section className="flex flex-col items-center gap-8 text-center">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Comptabilité experte
              <span className="block text-white/80">pour vos associations</span>
            </h1>
            <p className="text-base text-white/80">
              Retirez-vous du stress administratif : ComptAsso automatise vos finances associatives, suit vos budgets et sécurise vos remboursements, pour des équipes bénévoles plus sereines.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/comparatif-des-offres"
              className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Accéder à mon espace Asso
            </a>
          </div>

          <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-purple-500/20">
              <p className="text-xs uppercase tracking-[0.08em] text-white/60">Budget suivi</p>
              <p className="mt-1 text-2xl font-semibold text-white">98%</p>
              <p className="text-xs text-white/60">des dépenses catégorisées</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-pink-500/20">
              <p className="text-xs uppercase tracking-[0.08em] text-white/60">Temps gagné</p>
              <p className="mt-1 text-2xl font-semibold text-white">2h30</p>
              <p className="text-xs text-white/60">par mois pour chaque trésorier</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-emerald-500/20">
              <p className="text-xs uppercase tracking-[0.08em] text-white/60">Paiements</p>
              <p className="mt-1 text-2xl font-semibold text-white">Sécurisés</p>
              <p className="text-xs text-white/60">workflow automatisé</p>
            </div>
          </div>
        </section>

        <section
          id="plans"
          className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur md:px-10 md:py-10 space-y-10"
        >
          {error && (
            <div className="rounded-2xl border border-red-300/60 bg-red-500/10 px-4 py-3 text-sm text-red-50">
              {error}
            </div>
          )}

          {!error && !isLoading && !hasPlans && (
            <div className="rounded-2xl border border-white/15 bg-black/30 px-4 py-6 text-center text-sm text-white/80">
              Les abonnements ComptAsso seront disponibles prochainement.
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {isLoading ? planSkeletons.map((_, index) => renderPlanSkeleton(index)) : plans.map(renderPlanCard)}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            {isLoading ? (
              renderComparisonSkeleton()
            ) : comparison && hasPlans ? (
              <table className="min-w-full border-separate border-spacing-y-1 text-sm text-white/80">
                <thead>
                  <tr>
                    <th className="bg-white/5 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/70">Fonctionnalités</th>
                    <th className="bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white">
                      {comparison.plans[0]?.name || "Plan A"}
                    </th>
                    <th className="bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white">
                      {comparison.plans[1]?.name || "Plan B"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row) => (
                    <tr key={row.id} className="bg-white/5">
                      <td className="rounded-l-xl border border-white/10 px-4 py-3 align-top">
                        <div className="text-sm font-semibold text-white">{row.label}</div>
                        {row.description && <p className="text-xs text-white/70">{row.description}</p>}
                      </td>
                      <td className="border-t border-b border-white/10 px-4 py-3 text-center align-middle">
                        <span className={row.planAIncluded ? "text-emerald-300" : "text-white/40"}>
                          {row.planAIncluded ? "✓" : "—"}
                        </span>
                      </td>
                      <td className="rounded-r-xl border border-white/10 px-4 py-3 text-center align-middle">
                        <span className={row.planBIncluded ? "text-emerald-300" : "text-white/40"}>
                          {row.planBIncluded ? "✓" : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-6 text-center text-sm text-white/80">Comparatif disponible prochainement.</div>
            )}
          </div>

          <div className="space-y-10">
            {isLoading
              ? Array.from({ length: 2 }).map((_, index) => renderSectionSkeleton(index))
              : sections.map((section, index) => (
                  <section key={section.id} className="grid gap-8 lg:grid-cols-2 items-center">
                    <div className={`space-y-3 ${index % 2 === 1 ? "order-2 lg:order-1" : ""}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">{`Focus ${index + 1}`}</p>
                      <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                      <p className="text-sm text-white/80 whitespace-pre-line">{section.body}</p>
                    </div>
                    {section.imageUrl && (
                      <div
                        className={`overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/40 ${
                          index % 2 === 1 ? "order-1 lg:order-2" : ""
                        }`}
                      >
                        <img src={section.imageUrl} alt={section.title} className="w-full h-auto object-cover" />
                      </div>
                    )}
                  </section>
                ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ComptAssoSubscriptionPage;
