import React from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type RangePreset = "7d" | "30d" | "90d" | "ytd" | "all";

type DashboardStats = {
  range: { from: string; to: string };
  sales: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    newCustomers: number;
    totalCustomers: number;
    ordersByDay: { date: string; revenue: number; ordersCount: number }[];
  };
  products: {
    topProductsByRevenue: {
      productId: string;
      productName: string;
      revenue: number;
      ordersCount: number;
    }[];
    topProductsByDownloads: {
      productId: string;
      productName: string;
      downloadsCount: number;
    }[];
    totalDownloads: number;
  };
  promos: {
    promoUsageRate: number;
    topPromoCodes: {
      code: string;
      usageCount: number;
      totalDiscountAmount: number;
      revenueGenerated: number;
    }[];
  };
  users: {
    totalUsers: number;
    newUsers: number;
    payingCustomers: number;
    customersByCountry: { country: string; count: number }[];
  };
  subscriptions: {
    available: boolean;
    totalSubscriptions: number;
    activeSubscriptions: number;
    canceledSubscriptions: number;
    mrr: number;
  };
  articles: {
    totalArticlesPublished: number;
    articleViewsTotal: number;
    articleViewsByArticle: {
      articleId: string;
      articleTitle: string;
      viewsCount: number;
    }[];
  };
  interactions: {
    pageViewsTotal: number;
    pageViewsByUrl: { url: string; viewsCount: number }[];
    checkoutsStarted: number;
    checkoutsCompleted: number;
    conversionRateCheckout: number;
  };
};

const formatCurrency = (value: number) => `${(value / 100).toFixed(2)} €`;

const rangeOptions: { value: RangePreset; label: string }[] = [
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "90d", label: "90 derniers jours" },
  { value: "ytd", label: "Année en cours" },
  { value: "all", label: "Depuis le début" },
];

const AdminDashboardPage: React.FC = () => {
  const [range, setRange] = React.useState<RangePreset>("30d");
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStats = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/dashboard?range=${range}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            "Impossible de charger les statistiques du dashboard."
        );
      }
      setStats((data as { stats?: DashboardStats }).stats ?? null);
    } catch (err: unknown) {
      console.error("Erreur dashboard admin", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer les statistiques du dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [range]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-black">Dashboard admin</h1>
            <p className="text-xs text-slate-600">
              Synthèse des ventes, interactions et contenus pour la période sélectionnée.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setRange(option.value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                  range === option.value
                    ? "bg-black text-white border-black"
                    : "border-slate-300 text-slate-700 hover:border-black hover:text-black"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Chiffre d'affaires (période)
          </p>
          <p className="text-2xl font-semibold text-black">
            {loading ? "—" : formatCurrency(stats?.sales.totalRevenue ?? 0)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Commandes
          </p>
          <p className="text-2xl font-semibold text-black">
            {loading ? "—" : stats?.sales.totalOrders ?? 0}
          </p>
          <p className="text-[11px] text-slate-500">
            Panier moyen : {loading ? "—" : formatCurrency(stats?.sales.averageOrderValue ?? 0)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Nouveaux clients
          </p>
          <p className="text-2xl font-semibold text-black">
            {loading ? "—" : stats?.sales.newCustomers ?? 0}
          </p>
          <p className="text-[11px] text-slate-500">
            Clients payants totaux : {loading ? "—" : stats?.sales.totalCustomers ?? 0}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black">Top produits (CA)</h2>
            <p className="text-[11px] text-slate-500">Sur la période</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Produit</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">CA</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Commandes</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-slate-500">
                      Chargement des données…
                    </td>
                  </tr>
                )}
                {!loading && stats?.products.topProductsByRevenue.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-slate-500">
                      Aucun produit vendu sur la période.
                    </td>
                  </tr>
                )}
                {!loading &&
                  stats?.products.topProductsByRevenue.map((product) => (
                    <tr key={product.productId} className="odd:bg-white even:bg-slate-50">
                      <td className="px-3 py-2 text-slate-800">{product.productName}</td>
                      <td className="px-3 py-2 text-slate-800">{formatCurrency(product.revenue)}</td>
                      <td className="px-3 py-2 text-slate-800">{product.ordersCount}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black">Codes promo</h2>
            <p className="text-[11px] text-slate-500">
              Taux d'utilisation :
              {" "}
              {loading
                ? "—"
                : `${Math.round((stats?.promos.promoUsageRate ?? 0) * 100)}%`}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Code</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Utilisations</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Remise</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">CA généré</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-slate-500">
                      Chargement des données…
                    </td>
                  </tr>
                )}
                {!loading && stats?.promos.topPromoCodes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-slate-500">
                      Aucun code promo utilisé sur la période.
                    </td>
                  </tr>
                )}
                {!loading &&
                  stats?.promos.topPromoCodes.map((promo) => (
                    <tr key={promo.code} className="odd:bg-white even:bg-slate-50">
                      <td className="px-3 py-2 text-slate-800">{promo.code}</td>
                      <td className="px-3 py-2 text-slate-800">{promo.usageCount}</td>
                      <td className="px-3 py-2 text-slate-800">
                        {formatCurrency(promo.totalDiscountAmount)}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {formatCurrency(promo.revenueGenerated)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Utilisateurs totaux
          </p>
          <p className="text-2xl font-semibold text-black">
            {loading ? "—" : stats?.users.totalUsers ?? 0}
          </p>
          <p className="text-[11px] text-slate-500">
            Nouveaux : {loading ? "—" : stats?.users.newUsers ?? 0}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Clients payants
          </p>
          <p className="text-2xl font-semibold text-black">
            {loading ? "—" : stats?.users.payingCustomers ?? 0}
          </p>
          <p className="text-[11px] text-slate-500">Tous comptes ayant une commande payée.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Téléchargements
          </p>
          <p className="text-2xl font-semibold text-black">
            {loading ? "—" : stats?.products.totalDownloads ?? 0}
          </p>
          <p className="text-[11px] text-slate-500">Basé sur les liens de téléchargement utilisés.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black">Articles</h2>
            <Link
              to="/admin/articles"
              className="text-[11px] font-semibold text-emerald-700 underline-offset-2 hover:underline"
            >
              Gérer les articles
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Articles publiés</p>
              <p className="text-lg font-semibold text-black">
                {loading ? "—" : stats?.articles.totalArticlesPublished ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Vues sur la période</p>
              <p className="text-lg font-semibold text-black">
                {loading ? "—" : stats?.articles.articleViewsTotal ?? 0}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Titre</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Vues</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-slate-500">
                      Chargement des données…
                    </td>
                  </tr>
                )}
                {!loading && stats?.articles.articleViewsByArticle.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-slate-500">
                      Aucune vue d'article sur la période.
                    </td>
                  </tr>
                )}
                {!loading &&
                  stats?.articles.articleViewsByArticle.map((article) => (
                    <tr key={article.articleId} className="odd:bg-white even:bg-slate-50">
                      <td className="px-3 py-2 text-slate-800">{article.articleTitle}</td>
                      <td className="px-3 py-2 text-slate-800">{article.viewsCount}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black">Interactions</h2>
            <p className="text-[11px] text-slate-500">
              Conversion checkout :
              {" "}
              {loading
                ? "—"
                : `${Math.round((stats?.interactions.conversionRateCheckout ?? 0) * 100)}%`}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Pages vues</p>
              <p className="text-lg font-semibold text-black">
                {loading ? "—" : stats?.interactions.pageViewsTotal ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Checkouts démarrés</p>
              <p className="text-lg font-semibold text-black">
                {loading ? "—" : stats?.interactions.checkoutsStarted ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Checkouts complétés</p>
              <p className="text-lg font-semibold text-black">
                {loading ? "—" : stats?.interactions.checkoutsCompleted ?? 0}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">URL</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Vues</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-slate-500">
                      Chargement des données…
                    </td>
                  </tr>
                )}
                {!loading && stats?.interactions.pageViewsByUrl.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-slate-500">
                      Aucune page vue enregistrée sur la période.
                    </td>
                  </tr>
                )}
                {!loading &&
                  stats?.interactions.pageViewsByUrl.map((page) => (
                    <tr key={page.url} className="odd:bg-white even:bg-slate-50">
                      <td className="px-3 py-2 text-slate-800">{page.url}</td>
                      <td className="px-3 py-2 text-slate-800">{page.viewsCount}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
