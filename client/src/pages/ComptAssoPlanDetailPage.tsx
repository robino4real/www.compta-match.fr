import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { PaidServiceComparison, PaidServicePlan, PaidServiceSection } from "../types/paidServices";
import { formatPaidServicePrice } from "../lib/formatPaidServicePrice";

const ComptAssoPlanDetailPage: React.FC = () => {
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
        console.error("Erreur lors du chargement de la page offre ComptAsso", err);
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
    navigate("/comptasso");
  };

  const renderSectionSkeleton = (index: number) => (
    <div key={`section-skeleton-${index}`} className="h-56 rounded-3xl bg-white/10 border border-white/10 animate-pulse" />
  );

  const hasPlan = Boolean(selectedPlan);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070312] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-10 h-72 w-72 rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-purple-700/30 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 lg:px-8 lg:pb-20 lg:pt-16 space-y-10">
        <section className="flex flex-col gap-6 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/5 px-6 py-8 shadow-[0_35px_120px_rgba(0,0,0,0.45)] backdrop-blur md:px-10 md:py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-100 ring-1 ring-emerald-300/40">
                Offre ComptAsso
              </p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {selectedPlan?.name || "Offre introuvable"}
              </h1>
              {selectedPlan?.subtitle && <p className="text-sm md:text-base text-white/80">{selectedPlan.subtitle}</p>}
            </div>
            <div className="text-right">
              {selectedPlan && (
                <p className="text-2xl font-semibold text-white">
                  {formatPaidServicePrice(Number(selectedPlan.priceAmount), selectedPlan.priceCurrency)}
                  <span className="text-sm text-white/70"> /{selectedPlan.pricePeriod === "month" ? "mois" : "an"}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <button
              type="button"
              onClick={handleSubscribeClick}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-pink-500/30 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!hasPlan}
            >
              Souscrire à l’offre
            </button>
            <button
              type="button"
              onClick={handleBackToPlans}
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Retour aux offres
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-300/60 bg-red-500/10 px-4 py-3 text-sm text-red-50">{error}</div>
          )}
          {!error && !hasPlan && !isLoading && (
            <div className="rounded-2xl border border-amber-300/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
              Cette offre n’existe pas ou n’est plus disponible. Consultez la liste complète des formules ComptAsso.
            </div>
          )}
        </section>

        <section className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 px-6 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur md:px-10 md:py-10">
          {isLoading && (
            <>
              <div className="h-16 rounded-2xl bg-white/10 border border-white/10 animate-pulse" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-40 rounded-2xl bg-white/10 border border-white/10 animate-pulse" />
                <div className="h-40 rounded-2xl bg-white/10 border border-white/10 animate-pulse" />
              </div>
            </>
          )}

          {!isLoading && hasPlan && (
            <>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">Ce qui est inclus</p>
                  <h2 className="text-xl font-semibold text-white">Tout ce que votre abonnement couvre</h2>
                  <p className="mt-1 text-sm text-white/70">
                    Découvrez le détail des fonctionnalités prévues pour la formule {selectedPlan.name}.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-300/40">
                  Plan {selectedPlan.name}
                </span>
              </div>

              {includedFeatures.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {includedFeatures.map((feature) => (
                    <article
                      key={feature.id}
                      className="flex h-full flex-col gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200">
                          ✓
                        </span>
                        <h3 className="text-base font-semibold text-white">{feature.label}</h3>
                      </div>
                      {feature.description && (
                        <p className="pl-11 text-sm text-white/70">{feature.description}</p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/15 bg-black/40 px-4 py-6 text-center text-sm text-white/80">
                  Les détails de cette formule seront bientôt disponibles.
                </div>
              )}
            </>
          )}
        </section>

        <section className="space-y-10 rounded-[28px] border border-white/10 bg-white/5 px-6 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur md:px-10 md:py-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">Pour aller plus loin</p>
              <h2 className="text-xl font-semibold text-white">Comment ComptAsso accompagne votre association</h2>
            </div>
            <button
              type="button"
              onClick={handleSubscribeClick}
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!hasPlan}
            >
              Souscrire
            </button>
          </div>

          {isLoading
            ? sectionSkeletons.map((_, index) => renderSectionSkeleton(index))
            : sections.map((section, index) => (
                <article key={section.id} className="grid gap-8 lg:grid-cols-2 items-center">
                  <div className={`space-y-3 ${index % 2 === 1 ? "order-2 lg:order-1" : ""}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">{`Étape ${index + 1}`}</p>
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
                </article>
              ))}
        </section>
      </div>
    </main>
  );
};

export default ComptAssoPlanDetailPage;
