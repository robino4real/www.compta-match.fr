import React from "react";
import { API_BASE_URL } from "../config/api";
import { PaidServiceComparison, PaidServicePlan, PaidServiceSection } from "../types/paidServices";
import { formatPaidServicePrice } from "../lib/formatPaidServicePrice";

const ComptAssoSubscriptionPage: React.FC = () => {
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

  const renderPlanCard = (plan: PaidServicePlan) => (
    <article
      key={plan.id}
      className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm"
    >
      <header className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
        <p className="text-right text-base font-semibold text-slate-900">
          {formatPaidServicePrice(Number(plan.priceAmount), plan.priceCurrency)}
          <span className="text-sm text-slate-500"> /{plan.pricePeriod === "month" ? "mois" : "an"}</span>
        </p>
      </header>
      {plan.subtitle && <p className="mt-2 text-sm text-slate-600">{plan.subtitle}</p>}
      <button
        className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-200 px-6 py-3 text-sm font-medium text-slate-600 cursor-not-allowed"
        disabled
        type="button"
      >
        Bientôt disponible
      </button>
    </article>
  );

  const renderPlanSkeleton = (index: number) => (
    <div
      key={`skeleton-${index}`}
      className="h-52 rounded-3xl border border-slate-200 bg-slate-100 animate-pulse"
    />
  );

  const renderComparisonSkeleton = () => (
    <div className="h-48 rounded-2xl border border-slate-100 bg-slate-100 animate-pulse" />
  );

  const renderSectionSkeleton = (index: number) => (
    <div key={`section-skeleton-${index}`} className="h-56 rounded-3xl bg-slate-100 border border-slate-100 animate-pulse" />
  );

  const hasPlans = plans.length > 0;

  return (
    <main className="bg-white min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 space-y-10">
        <section className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Abonnement à la web app <span className="block">ComptAsso</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-600">
            Découvrez les services SaaS ComptAsso pour gérer vos associations avec la même simplicité que ComptaPro.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-900 px-6 py-6 shadow-lg md:flex md:items-center md:justify-between md:px-10 md:py-8">
          <div className="space-y-2 text-white md:max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">Accès ComptAsso</p>
            <p className="text-sm md:text-base text-slate-100">
              Les espaces ComptAsso seront bientôt accessibles pour gérer vos outils en ligne dédiés aux associations.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white/60 px-6 py-3 text-center text-sm font-semibold text-slate-900 shadow-md transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70 md:mt-0 md:w-auto"
          >
            Bientôt disponible
          </button>
        </section>

        <section className="bg-white rounded-3xl border border-slate-100 shadow-[0_24px_60px_rgba(15,23,42,0.06)] px-6 py-8 md:px-10 md:py-10 space-y-10">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!error && !isLoading && !hasPlans && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-700">
              Les abonnements ComptAsso seront disponibles prochainement.
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {isLoading ? planSkeletons.map((_, index) => renderPlanSkeleton(index)) : plans.map(renderPlanCard)}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100">
            {isLoading ? (
              renderComparisonSkeleton()
            ) : comparison && hasPlans ? (
              <table className="min-w-full border-separate border-spacing-y-1 text-sm text-slate-700">
                <thead>
                  <tr>
                    <th className="bg-white px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fonctionnalités</th>
                    <th className="bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900">
                      {comparison.plans[0]?.name || "Plan A"}
                    </th>
                    <th className="bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900">
                      {comparison.plans[1]?.name || "Plan B"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row) => (
                    <tr key={row.id} className="bg-white">
                      <td className="rounded-l-xl border border-slate-100 px-4 py-3 align-top">
                        <div className="text-sm font-medium text-slate-900">{row.label}</div>
                        {row.description && <p className="text-xs text-slate-500">{row.description}</p>}
                      </td>
                      <td className="border-t border-b border-slate-100 px-4 py-3 text-center align-middle">
                        <span className={row.planAIncluded ? "text-emerald-600" : "text-slate-400"}>
                          {row.planAIncluded ? "✓" : "—"}
                        </span>
                      </td>
                      <td className="rounded-r-xl border border-slate-100 px-4 py-3 text-center align-middle">
                        <span className={row.planBIncluded ? "text-emerald-600" : "text-slate-400"}>
                          {row.planBIncluded ? "✓" : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-6 text-center text-sm text-slate-600">Comparatif disponible prochainement.</div>
            )}
          </div>

          <div className="space-y-10">
            {isLoading
              ? Array.from({ length: 2 }).map((_, index) => renderSectionSkeleton(index))
              : sections.map((section, index) => (
                  <section key={section.id} className="grid gap-8 lg:grid-cols-2 items-center">
                    <div className={`space-y-3 ${index % 2 === 1 ? "order-2 lg:order-1" : ""}`}>
                      <h3 className="text-xl font-semibold text-slate-900">{section.title}</h3>
                      <p className="text-sm text-slate-700 whitespace-pre-line">{section.body}</p>
                    </div>
                    {section.imageUrl && (
                      <div
                        className={`overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm ${
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
