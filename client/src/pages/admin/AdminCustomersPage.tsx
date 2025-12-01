import React from "react";
import { API_BASE_URL } from "../../config/api";
import { DashboardRange, DashboardStatsResponse } from "../../types/dashboard";

interface AdminUserSummary {
  id: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

type SegmentKey = "all" | "verified" | "unverified" | "admins" | "customers" | "recent";

type StatKey =
  | "totalRegisteredUsers"
  | "newUsersInRange"
  | "customersWithOrdersAllTime"
  | "customersWithOrdersInRange";

const rangeOptions: { value: DashboardRange; label: string }[] = [
  { value: "all", label: "Depuis l'origine" },
  { value: "year", label: "Cette année" },
  { value: "month", label: "Ce mois" },
  { value: "week", label: "Cette semaine" },
  { value: "day", label: "Aujourd'hui" },
];

const AdminCustomersPage: React.FC = () => {
  const [users, setUsers] = React.useState<AdminUserSummary[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
  const [errorUsers, setErrorUsers] = React.useState<string | null>(null);

  const [statsRange, setStatsRange] = React.useState<DashboardRange>("all");
  const [customerStats, setCustomerStats] = React.useState<DashboardStatsResponse["customers"] | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(false);
  const [statsError, setStatsError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [segment, setSegment] = React.useState<SegmentKey>("all");
  const [highlightedStat, setHighlightedStat] = React.useState<StatKey | null>(null);

  const fetchUsers = React.useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      setErrorUsers(null);
      const response = await fetch(`${API_BASE_URL}/admin/users`, { credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "Impossible de charger la base client.");
      }
      const list = Array.isArray((data as { users?: unknown }).users)
        ? ((data as { users?: AdminUserSummary[] }).users as AdminUserSummary[])
        : [];
      setUsers(list);
    } catch (err: any) {
      console.error("Erreur chargement base clients", err);
      setErrorUsers(err?.message || "Une erreur est survenue pendant le chargement.");
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const fetchStats = React.useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const response = await fetch(`${API_BASE_URL}/admin/dashboard?range=${statsRange}`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "Impossible de récupérer les statistiques.");
      }
      setCustomerStats((data as { stats?: DashboardStatsResponse }).stats?.customers ?? null);
    } catch (err: any) {
      console.error("Erreur chargement stats clients", err);
      setStatsError(err?.message || "Impossible de charger les statistiques.");
    } finally {
      setStatsLoading(false);
    }
  }, [statsRange]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const verifiedCount = React.useMemo(
    () => users.filter((user) => user.isEmailVerified).length,
    [users]
  );
  const adminsCount = React.useMemo(
    () => users.filter((user) => user.role?.toLowerCase() === "admin").length,
    [users]
  );

  const segments: { key: SegmentKey; label: string; count: number; helper?: string }[] = [
    { key: "all", label: "Base complète", count: users.length, helper: "Toutes les fiches" },
    { key: "verified", label: "Email vérifié", count: verifiedCount, helper: "Priorité marketing" },
    { key: "unverified", label: "Email non vérifié", count: users.length - verifiedCount, helper: "À relancer" },
    { key: "customers", label: "Profils clients", count: users.length - adminsCount, helper: "Rôle ≠ admin" },
    { key: "admins", label: "Admins", count: adminsCount, helper: "Comptes internes" },
    { key: "recent", label: "Nouveaux 30j", count: users.filter((user) => Date.now() - new Date(user.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000).length, helper: "Onboarding" },
  ];

  const filteredUsers = React.useMemo(() => {
    const term = search.toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !term ||
        user.email.toLowerCase().includes(term) ||
        user.id.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term);

      const createdDate = new Date(user.createdAt).getTime();
      const recentCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;

      const matchesSegment =
        segment === "all" ||
        (segment === "verified" && user.isEmailVerified) ||
        (segment === "unverified" && !user.isEmailVerified) ||
        (segment === "admins" && user.role.toLowerCase() === "admin") ||
        (segment === "customers" && user.role.toLowerCase() !== "admin") ||
        (segment === "recent" && createdDate >= recentCutoff);

      return matchesSearch && matchesSegment;
    });
  }, [users, search, segment]);

  const statEntries: { key: StatKey; label: string; value: number; helper: string }[] = [
    {
      key: "totalRegisteredUsers",
      label: "Comptes créés",
      value: customerStats?.totalRegisteredUsers ?? 0,
      helper: "Base totale enregistrée",
    },
    {
      key: "newUsersInRange",
      label: "Nouveaux sur la période",
      value: customerStats?.newUsersInRange ?? 0,
      helper: `Période : ${rangeOptions.find((opt) => opt.value === statsRange)?.label}`,
    },
    {
      key: "customersWithOrdersAllTime",
      label: "Acheteurs identifiés",
      value: customerStats?.customersWithOrdersAllTime ?? 0,
      helper: "Commandes payées (tous temps)",
    },
    {
      key: "customersWithOrdersInRange",
      label: "Acheteurs sur la période",
      value: customerStats?.customersWithOrdersInRange ?? 0,
      helper: `Range : ${rangeOptions.find((opt) => opt.value === statsRange)?.label}`,
    },
  ];

  const handleStatClick = (key: StatKey) => {
    setHighlightedStat(key);
    if (key === "newUsersInRange") {
      setSegment("recent");
    } else if (key === "totalRegisteredUsers") {
      setSegment("all");
    } else if (key === "customersWithOrdersAllTime" || key === "customersWithOrdersInRange") {
      setSegment("customers");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Base client</p>
            <h1 className="text-2xl font-semibold text-black">Vue 360° des clients</h1>
            <p className="text-sm text-slate-600">
              Identifiez tous les profils, filtrez par statut et plongez dans les chiffres clés.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="stats-range" className="text-xs font-semibold text-slate-700">
              Période statistique
            </label>
            <select
              id="stats-range"
              value={statsRange}
              onChange={(e) => setStatsRange(e.target.value as DashboardRange)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
            >
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-black">Statistiques cliquables</h2>
              <p className="text-xs text-slate-600">Activez un filtre en sélectionnant un chiffre.</p>
            </div>
            {statsLoading && <span className="text-[11px] text-slate-500">Mise à jour...</span>}
          </div>

          {statsError && <p className="text-[11px] text-red-600">{statsError}</p>}

          <div className="space-y-2">
            {statEntries.map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => handleStatClick(entry.key)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  highlightedStat === entry.key
                    ? "border-black bg-black text-white"
                    : "border-slate-200 bg-slate-50 text-slate-800 hover:border-black hover:bg-white"
                }`}
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide">{entry.label}</p>
                  <p className="text-xs opacity-80">{entry.helper}</p>
                </div>
                <span className="text-lg font-semibold">{entry.value}</span>
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Sélection active</p>
            <p className="mt-1 text-slate-600">
              {highlightedStat
                ? statEntries.find((entry) => entry.key === highlightedStat)?.helper
                : "Aucune statistique sélectionnée"}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-black">Base clients</h2>
              <p className="text-xs text-slate-600">Toutes les fiches avec filtre instantané.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Rechercher par email, id ou rôle"
              />
              <div className="flex flex-wrap gap-2">
                {segments.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSegment(item.key)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                      segment === item.key
                        ? "bg-black text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-black hover:text-black"
                    }`}
                    aria-label={`Filtrer ${item.label}`}
                  >
                    {item.label} ({item.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoadingUsers && <p className="text-[11px] text-slate-500">Chargement des clients...</p>}
          {errorUsers && <p className="text-[11px] text-red-600">{errorUsers}</p>}

          {!isLoadingUsers && filteredUsers.length === 0 && !errorUsers && (
            <p className="text-[11px] text-slate-600">Aucun client ne correspond à ce filtre.</p>
          )}

          {!isLoadingUsers && filteredUsers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Email</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Rôle</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Vérification</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Créé le</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="odd:bg-white even:bg-slate-50">
                      <td className="px-3 py-2 align-top text-slate-800">{user.email}</td>
                      <td className="px-3 py-2 align-top text-slate-800">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                          {user.role || "user"}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top text-slate-800">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            user.isEmailVerified
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {user.isEmailVerified ? "Email vérifié" : "À vérifier"}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top text-slate-800">
                        {new Date(user.createdAt).toISOString().slice(0, 10)}
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-slate-600">{user.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-4 text-[11px] text-slate-700">
            <p className="font-semibold text-slate-900">Conseil</p>
            <p className="mt-1 text-slate-600">
              La sélection d&apos;une statistique ajuste automatiquement le filtre. Exportez la table (⌘+A puis
              copier) pour enrichir un CRM ou une audience publicitaire.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminCustomersPage;
