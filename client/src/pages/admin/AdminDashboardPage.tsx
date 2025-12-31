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

const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });

const startOfWeek = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

type SalesChartVariant = "bar" | "line";

const SalesTimelineChart: React.FC<{
  data: RevenuePoint[];
  loading: boolean;
  variant: SalesChartVariant;
}> = ({ data, loading, variant }) => {
  const rawGradientId = React.useId();
  const gradientId = React.useMemo(() => rawGradientId.replace(/:/g, "-"), [rawGradientId]);
  const maxRevenue = React.useMemo(
    () => Math.max(...data.map((point) => point.revenue), 1),
    [data]
  );
  const ySteps = 4;
  const yTicks = React.useMemo(
    () => Array.from({ length: ySteps + 1 }, (_, index) => Math.round((maxRevenue / ySteps) * index)),
    [maxRevenue]
  );

  if (loading) {
    return <div className="h-52 animate-pulse rounded-xl bg-slate-100" />;
  }

  if (!data.length) {
    return <p className="text-sm text-slate-500">Aucune commande sur cette période.</p>;
  }

  if (variant === "line") {
    const chartHeight = 240;
    const chartWidth = Math.max(320, data.length * 100);
    const yPadding = 36;
    const xPadding = 64;
    const points = data.map((point, index) => {
      const x = xPadding + (index / Math.max(1, data.length - 1)) * (chartWidth - xPadding * 2);
      const y = chartHeight - yPadding - (point.revenue / maxRevenue) * (chartHeight - yPadding * 2);
      return { x, y, label: point.label, revenue: point.revenue, orders: point.ordersCount };
    });

    const smoothing = 0.2;
    const controlPoint = (
      current: { x: number; y: number },
      previous: { x: number; y: number } | null,
      next: { x: number; y: number } | null,
      reverse = false
    ) => {
      const p = previous || current;
      const n = next || current;
      const o = {
        length: Math.hypot(n.x - p.x, n.y - p.y),
        angle: Math.atan2(n.y - p.y, n.x - p.x),
      };
      const angle = o.angle + (reverse ? Math.PI : 0);
      const length = o.length * smoothing;
      return {
        x: current.x + Math.cos(angle) * length,
        y: current.y + Math.sin(angle) * length,
      };
    };

    const buildSmoothPath = () => {
      if (points.length === 1) return `M${points[0].x},${points[0].y}`;
      return points.reduce((path, point, index, array) => {
        if (index === 0) return `M${point.x},${point.y}`;
        const cps = controlPoint(array[index - 1], array[index - 2] ?? null, point);
        const cpe = controlPoint(point, array[index - 1], array[index + 1] ?? null, true);
        return `${path} C ${cps.x},${cps.y} ${cpe.x},${cpe.y} ${point.x},${point.y}`;
      }, "");
    };

    const path = buildSmoothPath();
    const areaPath = `${path} L ${points[points.length - 1].x},${chartHeight - yPadding} L ${points[0].x},${chartHeight - yPadding} Z`;

    return (
      <div className="space-y-3">
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="h-72 w-full min-w-[340px] text-emerald-600"
            role="img"
            aria-label="Courbe du chiffre d'affaires"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.12} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <rect
              x={0}
              y={0}
              width={chartWidth}
              height={chartHeight}
              rx={18}
              className="fill-white"
            />
            {yTicks.map((tick) => {
              const y = chartHeight - yPadding - (tick / Math.max(maxRevenue, 1)) * (chartHeight - yPadding * 2);
              return (
                <g key={tick}>
                  <line
                    x1={xPadding}
                    x2={chartWidth - xPadding + 8}
                    y1={y}
                    y2={y}
                    className="stroke-slate-200"
                    strokeDasharray="3 3"
                  />
                  <text x={12} y={y + 4} className="fill-slate-500 text-[10px] font-medium">
                    {formatCurrency(tick)}
                  </text>
                </g>
              );
            })}
            <line
              x1={xPadding}
              x2={chartWidth - xPadding + 8}
              y1={chartHeight - yPadding}
              y2={chartHeight - yPadding}
              className="stroke-slate-300"
              strokeLinecap="round"
            />
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path d={path} className="fill-none stroke-current drop-shadow-sm" strokeWidth={3} strokeLinecap="round" />
            {points.map((point) => (
              <g key={point.label}>
                <text
                  x={point.x}
                  y={point.y - 10}
                  textAnchor="middle"
                  className="fill-slate-700 text-[10px] font-semibold"
                >
                  {formatCurrency(point.revenue)}
                </text>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={7}
                  className="fill-white stroke-current"
                  strokeWidth={2.5}
                >
                  <title>{`${point.label} — ${formatCurrency(point.revenue)} • ${point.orders} commande(s)`}</title>
                </circle>
                <text
                  x={point.x}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  className="fill-slate-600 text-[11px]"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <p className="text-[11px] text-slate-500">Survolez les points pour consulter le chiffre d'affaires et le nombre de commandes par période.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-y-5 left-0 flex flex-col justify-between text-[10px] font-medium text-slate-500">
          {yTicks
            .slice()
            .reverse()
            .map((tick) => (
              <span key={tick} className="pr-3 text-right">
                {formatCurrency(tick)}
              </span>
            ))}
        </div>
        <div className="overflow-x-auto pl-16">
          <div
            className="relative flex min-h-[230px] items-end gap-4 rounded-xl border border-slate-100 bg-white/80 p-4 shadow-inner"
            style={{
              backgroundImage: "linear-gradient(to top, rgba(148,163,184,0.16) 1px, transparent 1px)",
              backgroundSize: "100% 25%",
            }}
          >
            {data.map((point) => {
              const height = Math.max(10, Math.round((point.revenue / maxRevenue) * 180));
              return (
                <div key={point.date} className="flex flex-col items-center gap-2 text-xs">
                  <div className="text-[10px] font-semibold text-slate-700">{formatCurrency(point.revenue)}</div>
                  <div className="flex h-44 w-12 items-end justify-center rounded-lg bg-emerald-50/60 p-1 shadow-inner">
                    <div
                      className="w-full rounded-md bg-emerald-500 transition hover:translate-y-[-2px] hover:scale-[1.02] hover:bg-emerald-600"
                      style={{ height }}
                      title={`${point.label} — ${formatCurrency(point.revenue)} • ${point.ordersCount} commande(s)`}
                    />
                  </div>
                  <span className="whitespace-nowrap text-[11px] font-medium text-slate-600">{point.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-500">
        Survolez les barres pour consulter le chiffre d'affaires et le nombre de commandes par période.
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
  const [includeTestAccount, setIncludeTestAccount] = React.useState<boolean>(true);
  const [chartVariant, setChartVariant] = React.useState<SalesChartVariant>("bar");
  const today = React.useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = React.useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState<number>(today.getMonth());
  const [selectedWeekStart, setSelectedWeekStart] = React.useState<Date>(startOfWeek(today));

  const fetchStats = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        range,
        includeTestAccount: includeTestAccount ? "true" : "false",
      });

      if (range === "year") {
        params.set("year", selectedYear.toString());
      }
      if (range === "month") {
        params.set("year", selectedYear.toString());
        params.set("month", (selectedMonth + 1).toString());
      }
      if (range === "week") {
        params.set("weekStart", selectedWeekStart.toISOString());
      }

      const response = await fetch(`${API_BASE_URL}/admin/dashboard?${params.toString()}`, {
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
  }, [range, includeTestAccount, selectedMonth, selectedWeekStart, selectedYear]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const goToPreviousYear = () => setSelectedYear((year) => year - 1);
  const goToNextYear = () => setSelectedYear((year) => year + 1);

  const goToPreviousMonth = () => {
    const base = new Date(selectedYear, selectedMonth, 1);
    base.setMonth(base.getMonth() - 1);
    setSelectedYear(base.getFullYear());
    setSelectedMonth(base.getMonth());
  };

  const goToNextMonth = () => {
    const base = new Date(selectedYear, selectedMonth, 1);
    base.setMonth(base.getMonth() + 1);
    setSelectedYear(base.getFullYear());
    setSelectedMonth(base.getMonth());
  };

  const goToPreviousWeek = () => {
    setSelectedWeekStart((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() - 7);
      return startOfWeek(next);
    });
  };

  const goToNextWeek = () => {
    setSelectedWeekStart((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + 7);
      return startOfWeek(next);
    });
  };

  const selectedMonthDate = React.useMemo(() => new Date(selectedYear, selectedMonth, 1), [selectedMonth, selectedYear]);
  const selectedWeekEnd = React.useMemo(() => {
    const end = new Date(selectedWeekStart);
    end.setDate(selectedWeekStart.getDate() + 6);
    return end;
  }, [selectedWeekStart]);
  const weekLabel = React.useMemo(
    () => `Semaine du ${shortDateFormatter.format(selectedWeekStart)} au ${shortDateFormatter.format(selectedWeekEnd)}`,
    [selectedWeekEnd, selectedWeekStart]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vue d'ensemble</p>
            <h1 className="text-2xl font-semibold text-black">Dashboard admin</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Synthèse claire des ventes, de la clientèle et des interactions produits sur la période sélectionnée.
            </p>
            {stats && (
              <p className="text-xs text-slate-500">
                Mis à jour : {new Date(stats.generatedAt).toLocaleString("fr-FR")}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 shadow-inner">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                checked={includeTestAccount}
                onChange={(event) => setIncludeTestAccount(event.target.checked)}
                id="include-test-account"
              />
              <label htmlFor="include-test-account" className="cursor-pointer select-none">
                Inclure le compte test
              </label>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm">
              <label htmlFor="dashboard-range" className="text-slate-600">
                Période
              </label>
              <select
                id="dashboard-range"
                value={range}
                onChange={(event) => setRange(event.target.value as DashboardRange)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                {rangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {range === "year" && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-800 shadow-sm">
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 hover:bg-slate-100"
                  onClick={goToPreviousYear}
                  aria-label="Année précédente"
                >
                  ←
                </button>
                <span className="px-2">{selectedYear}</span>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 hover:bg-slate-100"
                  onClick={goToNextYear}
                  aria-label="Année suivante"
                >
                  →
                </button>
              </div>
            )}
            {range === "month" && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-800 shadow-sm">
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 hover:bg-slate-100"
                  onClick={goToPreviousMonth}
                  aria-label="Mois précédent"
                >
                  ←
                </button>
                <span className="px-2 capitalize">{monthFormatter.format(selectedMonthDate)}</span>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 hover:bg-slate-100"
                  onClick={goToNextMonth}
                  aria-label="Mois suivant"
                >
                  →
                </button>
              </div>
            )}
            {range === "week" && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-800 shadow-sm">
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 hover:bg-slate-100"
                  onClick={goToPreviousWeek}
                  aria-label="Semaine précédente"
                >
                  ←
                </button>
                <span className="px-2 whitespace-nowrap">{weekLabel}</span>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 hover:bg-slate-100"
                  onClick={goToNextWeek}
                  aria-label="Semaine suivante"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-black">Chiffres réalisés</h2>
            <p className="text-sm text-slate-600">Chiffre d'affaires, frais et commandes.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {rangeOptions.find((o) => o.value === range)?.label}
            </span>
            <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 shadow-inner">
              <button
                type="button"
                className={`px-3 py-1.5 transition ${chartVariant === "bar" ? "bg-white text-emerald-700 shadow-sm" : "hover:bg-white/60"}`}
                onClick={() => setChartVariant("bar")}
              >
                Barres
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 transition ${chartVariant === "line" ? "bg-white text-emerald-700 shadow-sm" : "hover:bg-white/60"}`}
                onClick={() => setChartVariant("line")}
              >
                Courbe
              </button>
            </div>
          </div>
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
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">Évolution du CA</p>
            <p className="text-xs text-slate-500">CA en {chartVariant === "bar" ? "barres" : "courbe"}</p>
          </div>
          <div className="mt-3">
            <SalesTimelineChart data={stats?.sales.timeline ?? []} loading={loading} variant={chartVariant} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">Chiffres clientèle</h2>
            <p className="text-sm text-slate-600">Inscriptions, acheteurs et abonnés.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
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
              <thead className="bg-white">
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
                    <tr key={product.productId} className="odd:bg-white even:bg-white">
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
              <thead className="bg-white">
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
                      <tr key={interaction.productId} className="odd:bg-white even:bg-white">
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
