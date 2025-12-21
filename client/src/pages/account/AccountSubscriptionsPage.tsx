import React from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface SubscriptionPlan {
  id: string;
  name: string;
  subtitle?: string | null;
  priceAmount?: string;
  priceCurrency?: string;
  pricePeriod?: string;
}

interface UserSubscription {
  id: string;
  status: "ACTIVE" | "CANCELED" | "EXPIRED";
  currentPeriodEnd?: string | null;
  createdAt: string;
  plan: SubscriptionPlan;
}

const statusLabel: Record<UserSubscription["status"], string> = {
  ACTIVE: "Actif",
  CANCELED: "Annulé",
  EXPIRED: "Expiré",
};

const badgeColors: Record<UserSubscription["status"], string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  CANCELED: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-slate-100 text-slate-700",
};

const AccountSubscriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = React.useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/account/subscriptions`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Impossible de charger les abonnements.");
        }

        setSubscriptions((data?.subscriptions as UserSubscription[]) || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <main className="bg-white min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 space-y-6">
        <div className="flex">
          <button
            onClick={() => navigate("/compte")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-black hover:text-black"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.6}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5m-7.5 7.5h12" />
            </svg>
            Retour à mon profil
          </button>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Espace client</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Mes abonnements</h1>
          <p className="text-sm text-slate-600 mt-2">
            Consultez vos formules actives, leur statut et vos prochaines échéances.
          </p>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 text-sm text-slate-600 shadow-sm">
            Chargement de vos abonnements...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800 shadow-sm">
            {error}
          </div>
        )}

        {!isLoading && !error && subscriptions.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 text-sm text-slate-600 shadow-sm">
            Aucun abonnement actif pour le moment.
          </div>
        )}

        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      badgeColors[subscription.status]
                    }`}
                  >
                    {statusLabel[subscription.status]}
                  </span>
                  <span className="text-xs text-slate-500">
                    Souscrit le {new Date(subscription.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-slate-900">{subscription.plan?.name}</h2>
                {subscription.plan?.subtitle && (
                  <p className="text-sm text-slate-600">{subscription.plan.subtitle}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  {subscription.plan?.priceAmount && (
                    <span className="font-semibold text-slate-900">
                      {subscription.plan.priceAmount} {subscription.plan.priceCurrency || "€"}
                      {subscription.plan.pricePeriod ? ` / ${subscription.plan.pricePeriod}` : ""}
                    </span>
                  )}
                  {subscription.currentPeriodEnd && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.6}
                        stroke="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m3.75 0a9.75 9.75 0 1 1-19.5 0 9.75 9.75 0 0 1 19.5 0Z"
                        />
                      </svg>
                      Prochaine échéance : {new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default AccountSubscriptionsPage;
