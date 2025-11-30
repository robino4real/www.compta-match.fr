import React from "react";
import { API_BASE_URL } from "../../config/api";
import {
  DashboardRange,
  DashboardStatsResponse,
  RevenuePoint,
} from "../../types/dashboard";

const rangeOptions: { value: DashboardRange; label: string }[] = [
  { value: "all", label: "Au total" },
  { value: "year", label: "Année en cours" },
  { value: "month", label: "Mois en cours" },
  { value: "week", label: "Semaine en cours" },
  { value: "day", label: "Aujourd'hui" },
];

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const formatCurrency = (value: number) => currencyFormatter.format(value / 100);

const SalesTimelineChart: React.FC<{ data: RevenuePoint[]; loading: boolean }> = ({
  data,
  loading,
}) => {
  if (loading) {
    return <div className="h-52 animate-pulse rounded-xl bg-slate-100" />;
  }

  if (!data.length) {
    return <p className="text-sm text-slate-500">Aucune commande sur cette période.</p>;
  }

  const maxRevenue = Math.max(...data.map((point) => point.revenue), 1);

  return (
    <div className="space-y-4">
      <div className="flex h-56 items-end gap-3 overflow-x-auto pb-2">
        {data.map((point) => {
          const height = Math.max(8, Math.round((point.revenue / maxRevenue) * 200));
          return (
            <div key={point.date} className="flex flex-col items-center gap-2 text-xs">
              <div className="flex h-48 w-10 items-end justify-center rounded-md bg-slate-100 p-1">
                <div
                  className="w-full rounded-sm bg-emerald-500 transition hover:bg-emerald-600"
                  style={{ height }}
                  title={`${point.label} — ${formatCurrency(point.revenue)} • ${point.ordersCount} commande(s)`}
                />
              </div>
              <span className="whitespace-nowrap text-[11px] font-medium text-slate-600">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500">
        Survolez les barres pour consulter le chiffre d'affaires et le nombre de commandes par
        période.
      </p>
    </div>
  );
};

const KpiCard: React.FC<{
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
}> = ({ label, value, helper }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-black">{value}</p>
    {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
  </div>
);

const TableCell: React.FC<{
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}> = ({ children, className = "", colSpan }) => (
  <td className={`px-3 py-2 text-sm text-slate-800 ${className}`} colSpan={colSpan}>
    {children}
  </td>
);

const TableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
    {children}
  </th>
);

const AdminDashboardPage: React.FC = () => {
  const [range, setRange] = React.useState<DashboardRange>("month");
  const [stats, setStats] = React.useState<DashboardStatsResponse | null>(null);
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
        throw new Error((data as { message?: string }).message || "Impossible de charger le dashboard.");
      }
      setStats((data as { stats?: DashboardStatsResponse }).stats ?? null);
    } catch (err: unknown) {
      console.error("Erreur dashboard admin", err);
      setError(
        err instanceof Error ? err.message : "Impossible de récupérer les statistiques du dashboard."
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
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-black">Dashboard admin</h1>
          <p className="text-sm text-slate-600">
            Synthèse des ventes, de la clientèle et des interactions produits.
          </p>
          {stats && (
            <p className="text-xs text-slate-500">Mise à jour : {new Date(stats.generatedAt).toLocaleString("fr-FR")}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="dashboard-range" className="text-sm font-medium text-slate-700">
            Période
          </label>
          <select
            id="dashboard-range"
            value={range}
            onChange={(event) => setRange(event.target.value as DashboardRange)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none"
          >
            {rangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">Chiffres réalisés</h2>
            <p className="text-sm text-slate-600">Chiffre d'affaires, frais et commandes.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {rangeOptions.find((o) => o.value === range)?.label}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <KpiCard label="Chiffre d'affaires" value={loading ? "—" : formatCurrency(stats?.sales.totalRevenue ?? 0)} />
          <KpiCard
            label="Résultat net"
            value={loading ? "—" : formatCurrency(stats?.sales.netResult ?? 0)}
            helper={loading ? null : `Frais Stripe : ${formatCurrency(stats?.sales.totalStripeFees ?? 0)}`}
          />
          <KpiCard
            label="Commandes"
            value={loading ? "—" : stats?.sales.ordersCount ?? 0}
            helper={loading ? null : `${stats?.sales.timeline.length ?? 0} points sur la période`}
          />
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">Évolution du CA</p>
          <SalesTimelineChart data={stats?.sales.timeline ?? []} loading={loading} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">Chiffres clientèle</h2>
            <p className="text-sm text-slate-600">Inscriptions, acheteurs et abonnés.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <KpiCard label="Utilisateurs inscrits" value={loading ? "—" : stats?.customers.totalRegisteredUsers ?? 0} />
          <KpiCard
            label="Inscriptions sur la période"
            value={loading ? "—" : stats?.customers.newUsersInRange ?? 0}
          />
          <KpiCard
            label="Clients acheteurs (total)"
            value={loading ? "—" : stats?.customers.customersWithOrdersAllTime ?? 0}
          />
          <KpiCard
            label="Clients acheteurs (période)"
            value={loading ? "—" : stats?.customers.customersWithOrdersInRange ?? 0}
            helper={
              loading
                ? null
                : `Abonnés : ${stats?.customers.customersWithSubscriptionAllTime ?? 0}`
            }
          />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-black">Ventes par produit / abonnement</h2>
              <p className="text-sm text-slate-600">Classement décroissant par ventes sur la période.</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <TableHead>Produit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ventes période</TableHead>
                  <TableHead>Ventes totales</TableHead>
                  <TableHead>Abonnés</TableHead>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <TableCell colSpan={5} className="text-slate-500">
                      Chargement…
                    </TableCell>
                  </tr>
                )}
                {!loading && (stats?.products.sales.length ?? 0) === 0 && (
                  <tr>
                    <TableCell colSpan={5} className="text-slate-500">
                      Aucun produit vendu pour cette période.
                    </TableCell>
                  </tr>
                )}
                {!loading &&
                  stats?.products.sales.map((product) => (
                    <tr key={product.productId} className="odd:bg-white even:bg-slate-50">
                      <TableCell>{product.name}</TableCell>
                      <TableCell className="capitalize">{product.type}</TableCell>
                      <TableCell>{product.salesCountInRange}</TableCell>
                      <TableCell>{product.salesCountAllTime}</TableCell>
                      <TableCell>
                        {product.type === "subscription"
                          ? product.subscribersAllTime ?? 0
                          : "—"}
                      </TableCell>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-black">Interactions avec les produits</h2>
              <p className="text-sm text-slate-600">Vues et ajouts au panier sur la période.</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <TableHead>Produit</TableHead>
                  <TableHead>Vues</TableHead>
                  <TableHead>Ajouts au panier</TableHead>
                  <TableHead>Engagement</TableHead>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <TableCell colSpan={4} className="text-slate-500">
                      Chargement…
                    </TableCell>
                  </tr>
                )}
                {!loading && (stats?.products.interactions.length ?? 0) === 0 && (
                  <tr>
                    <TableCell colSpan={4} className="text-slate-500">
                      Aucune interaction trouvée sur la période.
                    </TableCell>
                  </tr>
                )}
                {!loading &&
                  stats?.products.interactions.map((interaction) => {
                    const total = interaction.viewsInRange + interaction.addToCartInRange;
                    const engagement = total > 0
                      ? Math.round((interaction.addToCartInRange / total) * 100)
                      : 0;
                    return (
                      <tr key={interaction.productId} className="odd:bg-white even:bg-slate-50">
                        <TableCell>{interaction.name}</TableCell>
                        <TableCell>{interaction.viewsInRange}</TableCell>
                        <TableCell>{interaction.addToCartInRange}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-full rounded-full bg-slate-200">
                              <div
                                className="h-2 rounded-full bg-emerald-500"
                                style={{ width: `${Math.min(100, engagement)}%` }}
                                aria-label={`Taux d'ajout au panier ${engagement}%`}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-700">{engagement}%</span>
                          </div>
                        </TableCell>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
