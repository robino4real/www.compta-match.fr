import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  PaidServiceComparison,
  PaidServicePlan,
  PaidServiceSection,
} from "../types/paidServices";
import { formatPaidServicePrice } from "../lib/formatPaidServicePrice";

const ComptaProPlanDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { planSlug } = useParams<{ planSlug: string }>();

  const [plans, setPlans] = React.useState<PaidServicePlan[]>([]);
  const [comparison, setComparison] = React.useState<PaidServiceComparison | null>(null);
  const [sections, setSections] = React.useState<PaidServiceSection[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const sectionSkeletons = React.useMemo(() => Array.from({ length: 2 }), []);

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
        console.error("Erreur lors du chargement de la page offre ComptaPro", err);
        setError("Une erreur est survenue, veuillez réessayer plus tard.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedPlan = React.useMemo(
    () => plans.find((plan) => plan.slug === planSlug),
    [plans, planSlug],
  );

  const comparisonPlanIndex = React.useMemo(() => {
    if (!comparison || !planSlug) return -1;
    return comparison.plans.findIndex((plan) => plan.slug === planSlug);
  }, [comparison, planSlug]);

  const includedFeatures = React.useMemo(() => {
    if (!comparison || comparisonPlanIndex === -1) return [];

    const inclusionKey = comparisonPlanIndex === 0 ? "planAIncluded" : "planBIncluded";

    return comparison.rows.filter((row) => row[inclusionKey]);
  }, [comparison, comparisonPlanIndex]);

  const handleSubscribeClick = () => {
    if (!planSlug) return;
    navigate(`/contact?plan=${encodeURIComponent(planSlug)}`);
  };

  const handleBackToPlans = () => {
    navigate("/comptapro");
  };

  const renderSectionSkeleton = (index: number) => (
    <div
      key={`section-skeleton-${index}`}
      className="h-56 rounded-3xl border border-white/10 bg-white/10 animate-pulse"
    />
  );

  const hasPlan = Boolean(selectedPlan);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a061a] via-[#120a2c] to-[#1b103f] py-12 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 lg:px-8 space-y-10">
        <section className="flex flex-col gap-4 rounded-3xl border border-fuchsia-300/25 bg-gradient-to-br from-[#5B21B6] via-[#7C3AED] to-[#1a0f36] px-6 py-8 text-white shadow-[0_28px_70px_rgba(0,0,0,0.55)] md:px-10 md:py-10">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-100">Offre ComptaPro</p>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {selectedPlan?.name || "Offre introuvable"}
              </h1>
              {selectedPlan?.subtitle && <p className="text-sm md:text-base text-white/85">{selectedPlan.subtitle}</p>}
            </div>
            <div className="text-right">
              {selectedPlan && (
                <p className="text-xl font-semibold text-white">
                  {formatPaidServicePrice(
                    Number(selectedPlan.priceAmount),
                    selectedPlan.priceCurrency,
                  )}
                  <span className="text-sm text-white/80"> /{selectedPlan.pricePeriod === "month" ? "mois" : "an"}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <button
              type="button"
              onClick={handleSubscribeClick}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#5B21B6] shadow-[0_18px_40px_rgba(168,85,247,0.3)] transition hover:-translate-y-[1px] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!hasPlan}
            >
              S’abonner
            </button>
            <button
              type="button"
              onClick={handleBackToPlans}
              className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Retour aux offres
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
          )}
          {!error && !hasPlan && !isLoading && (
            <div className="rounded-2xl border border-amber-300/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Cette offre n’existe pas ou n’est plus disponible. Consultez la liste complète des formules ComptaPro.
            </div>
          )}
        </section>

        <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.4)] md:px-10 md:py-10">
          {isLoading && (
            <>
              <div className="h-16 rounded-2xl border border-white/10 bg-white/10 animate-pulse" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-40 rounded-2xl border border-white/10 bg-white/10 animate-pulse" />
                <div className="h-40 rounded-2xl border border-white/10 bg-white/10 animate-pulse" />
              </div>
            </>
          )}

          {!isLoading && hasPlan && (
            <>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-fuchsia-200">Ce qui est inclus</p>
                  <h2 className="text-xl font-semibold text-white">Tout ce que votre abonnement couvre</h2>
                  <p className="mt-1 text-sm text-white/80">
                    Découvrez le détail des fonctionnalités prévues pour la formule {selectedPlan.name}.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/20">
                  Plan {selectedPlan.name}
                </span>
              </div>

              {includedFeatures.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {includedFeatures.map((feature) => (
                    <article
                      key={feature.id}
                      className="flex h-full flex-col gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1b103f] to-[#2f1660] px-4 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
                          ✓
                        </span>
                        <h3 className="text-base font-semibold text-white">{feature.label}</h3>
                      </div>
                      {feature.description && (
                        <p className="pl-11 text-sm text-white/75">{feature.description}</p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-white/80">
                  Les détails de cette formule seront bientôt disponibles.
                </div>
              )}
            </>
          )}
        </section>

        <section className="space-y-10 rounded-3xl border border-white/10 bg-white/5 px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.4)] md:px-10 md:py-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-fuchsia-200">Pour aller plus loin</p>
              <h2 className="text-xl font-semibold text-white">Comment ComptaPro vous accompagne</h2>
            </div>
            <button
              type="button"
              onClick={handleSubscribeClick}
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#5B21B6] shadow-[0_18px_40px_rgba(168,85,247,0.3)] transition hover:-translate-y-[1px] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!hasPlan}
            >
              S’abonner
            </button>
          </div>

          {isLoading
            ? sectionSkeletons.map((_, index) => renderSectionSkeleton(index))
            : sections.map((section, index) => (
                <article key={section.id} className="grid gap-8 lg:grid-cols-2 items-center">
                  <div className={`space-y-3 ${index % 2 === 1 ? "order-2 lg:order-1" : ""}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-fuchsia-200">{`Étape ${index + 1}`}</p>
                    <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                    <p className="text-sm text-white/80 whitespace-pre-line">{section.body}</p>
                  </div>
                  {section.imageUrl && (
                    <div
                      className={`overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.35)] ${
                        index % 2 === 1 ? "order-1 lg:order-2" : ""
                      }`}
                    >
                      <img src={section.imageUrl} alt={section.title} className="w-full h-auto object-cover" />
                    </div>
                  )}
                </article>
              ))}
        </section>
      </div>
    </main>
  );
};

export default ComptaProPlanDetailPage;
