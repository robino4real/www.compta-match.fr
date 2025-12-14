import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  PaidServiceComparison,
  PaidServicePlan,
  PaidServiceSection,
} from "../types/paidServices";
import { useAuth } from "../context/AuthContext";
import { formatPaidServicePrice } from "../lib/formatPaidServicePrice";

const ComptaProSubscriptionPage: React.FC = () => {
  const { isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = React.useState<PaidServicePlan[]>([]);
  const [comparison, setComparison] = React.useState<PaidServiceComparison | null>(null);
  const [sections, setSections] = React.useState<PaidServiceSection[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const planSkeletons = React.useMemo(() => Array.from({ length: 2 }), []);

  const handleBackClick = React.useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [navigate]);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [plansRes, comparisonRes, sectionsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/paid-services/public/plans?serviceType=COMPTAPRO`),
          fetch(`${API_BASE_URL}/paid-services/public/comparison?serviceType=COMPTAPRO`),
          fetch(`${API_BASE_URL}/paid-services/public/sections?serviceType=COMPTAPRO`),
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
        console.error("Erreur lors du chargement de la page ComptaPro", err);
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

  const handleProAccessClick = () => {
    if (isAuthLoading) return;

    navigate("/mon-espace-pro");
  };

  const ctaButtonClasses =
    "inline-flex items-center justify-center rounded-full bg-black/80 px-6 py-3 text-sm font-semibold text-white shadow-sm transition transform hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400 disabled:cursor-not-allowed";

  const backButtonClasses =
    "hero-back-button inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/15 text-base font-semibold text-white shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/25 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-300 sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-2.5";

  const renderPlanCard = (plan: PaidServicePlan) => (
    <article
      key={plan.id}
      className="halo-purple-card relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/50 bg-white/40 px-6 py-6 text-white shadow-xl backdrop-blur-lg"
    >
      <header className="relative flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
          {plan.subtitle && <p className="text-sm text-white/80">{plan.subtitle}</p>}
        </div>
        <p className="text-right text-lg font-semibold text-white">
          {formatPaidServicePrice(Number(plan.priceAmount), plan.priceCurrency)}
          <span className="text-sm text-white/80"> /{plan.pricePeriod === "month" ? "mois" : "an"}</span>
        </p>
      </header>
      <button className={`relative mt-6 ${ctaButtonClasses}`} onClick={handlePlanDetailClick}>
        En savoir plus
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
    <div className="h-48 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
  );

  const renderSectionSkeleton = (index: number) => (
    <div key={`section-skeleton-${index}`} className="h-56 rounded-3xl bg-slate-100 border border-slate-200 animate-pulse" />
  );

  const hasPlans = plans.length > 0;

  return (
    <main className="hero-comptapro min-h-screen bg-[#0c0316] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-10 lg:pt-16 page-safe-container space-y-12 lg:space-y-16">
        <div className="relative flex w-full items-center justify-center">
          <button
            type="button"
            onClick={handleBackClick}
            className={`${backButtonClasses} absolute left-0`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="sr-only">Retour</span>
            <span className="hidden sm:inline">Retour</span>
          </button>

          <span className="pointer-events-none text-center text-lg font-semibold tracking-tight text-white drop-shadow md:text-2xl">
            COMPTAMATCH
          </span>
        </div>

        <section className="flex flex-col items-center gap-8 text-center text-white">
          <div className="halo-title halo-title-comptapro relative space-y-4 max-w-4xl">
            <span className="pointer-events-none absolute -inset-x-10 -inset-y-6 -z-10 rounded-[32px] bg-gradient-to-r from-fuchsia-500/25 via-purple-800/30 to-fuchsia-400/25 blur-3xl" />
            <h1 className="halo-purple-title text-4xl font-bold leading-tight text-white drop-shadow md:text-5xl">
              Comptabilité experte
              <span className="block text-white">pour vos équipes</span>
            </h1>
            <p className="halo-purple-subtitle inline-block text-base text-fuchsia-100">
              Pilotez votre comptabilité en ligne : automatisation bancaire, contrôle des dépenses et reporting instantané pour donner de la visibilité à toute votre organisation.
            </p>

            <div className="flex flex-wrap justify-center gap-3 pt-3 pb-4">
              <button
                type="button"
                onClick={handleProAccessClick}
                disabled={isAuthLoading}
                className={ctaButtonClasses}
              >
                Accéder à mon espace Pro
              </button>
            </div>
          </div>
        </section>

        <section id="plans" className="pricing-section">
          <div className="space-y-10">
            {error && (
              <div className="rounded-2xl border border-red-500 bg-red-700 px-4 py-3 text-sm text-white">
                {error}
              </div>
            )}

            {!error && !isLoading && !hasPlans && (
              <div className="rounded-2xl border border-slate-500 bg-slate-800 px-4 py-6 text-center text-sm text-white">
                Les abonnements à la web app COMPTAMATCH seront disponibles prochainement.
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {isLoading
                ? planSkeletons.map((_, index) => renderPlanSkeleton(index))
                : plans.map(renderPlanCard)}
            </div>

            <div className="halo-purple-panel overflow-hidden rounded-3xl border border-white/50 bg-white/35 text-white shadow-lg backdrop-blur-lg">
              {isLoading ? (
                renderComparisonSkeleton()
              ) : comparison && hasPlans ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-1 text-sm">
                    <thead>
                      <tr>
                        <th className="bg-transparent px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">Fonctionnalités</th>
                        <th className="bg-transparent px-4 py-3 text-center text-sm font-semibold text-white">
                          {comparison.plans[0]?.name || "Plan A"}
                        </th>
                        <th className="bg-transparent px-4 py-3 text-center text-sm font-semibold text-white">
                          {comparison.plans[1]?.name || "Plan B"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.rows.map((row) => (
                        <tr key={row.id} className="bg-transparent">
                          <td className="rounded-l-xl border border-slate-200 px-4 py-3 align-top">
                            <div className="text-sm font-semibold text-white">{row.label}</div>
                            {row.description && <p className="text-xs text-white/80">{row.description}</p>}
                          </td>
                          <td className="border-t border-b border-slate-200 px-4 py-3 text-center align-middle">
                            <span className="text-white">
                              {row.planAIncluded ? "✓" : "—"}
                            </span>
                          </td>
                          <td className="rounded-r-xl border border-slate-200 px-4 py-3 text-center align-middle">
                            <span className="text-white">
                              {row.planBIncluded ? "✓" : "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">{`Focus ${index + 1}`}</p>
                        <h3 className="text-xl font-semibold text-slate-900">{section.title}</h3>
                        <p className="text-sm text-slate-700 whitespace-pre-line">{section.body}</p>
                      </div>
                      {section.imageUrl && (
                        <div
                          className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${
                            index % 2 === 1 ? "order-1 lg:order-2" : ""
                          }`}
                        >
                          <img src={section.imageUrl} alt={section.title} className="w-full h-auto object-cover" />
                        </div>
                      )}
                    </section>
                  ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ComptaProSubscriptionPage;
