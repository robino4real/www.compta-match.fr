import React from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface AdminUser {
  id: string;
  email: string;
  role?: string | null;
  isEmailVerified?: boolean | null;
  createdAt?: string | null;
}

const AdminDashboardPage: React.FC = () => {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/admin/users`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Impossible de récupérer la liste des utilisateurs."
          );
        }

        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (err: any) {
        console.error("Erreur admin /users :", err);
        setError(
          err?.message ||
            "Une erreur est survenue lors du chargement des utilisateurs."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const totalVerified = users.filter((u) => u.isEmailVerified).length;

  return (
    <div className="space-y-6">
      {/* Bloc présentation */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <h1 className="text-xl font-semibold text-black">
          Tableau de bord administrateur
        </h1>
        <p className="text-xs text-slate-600">
          Cet espace vous permet de suivre l&apos;activité de COMPTAMATCH : comptes
          clients, abonnements, commandes de logiciels téléchargeables et
          statistiques d&apos;usage. Les données ci-dessous sont en cours de
          mise en place et évolueront au fur et à mesure.
        </p>
      </section>

      {/* Cartes résumé */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <h2 className="text-xs font-semibold text-black uppercase tracking-wide">
            Comptes clients
          </h2>
          <p className="text-2xl font-semibold text-black">
            {isLoading ? "—" : totalUsers}
          </p>
          <p className="text-[11px] text-slate-500">
            Nombre total de comptes créés. Ce chiffre sera complété par des filtres
            et des périodes plus tard.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <h2 className="text-xs font-semibold text-black uppercase tracking-wide">
            Comptes vérifiés
          </h2>
          <p className="text-2xl font-semibold text-black">
            {isLoading ? "—" : totalVerified}
          </p>
          <p className="text-[11px] text-slate-500">
            Nombre de comptes ayant confirmé leur adresse email. Cela dépendra du
            système de vérification mis en place.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <h2 className="text-xs font-semibold text-black uppercase tracking-wide">
            Administrateurs
          </h2>
          <p className="text-2xl font-semibold text-black">
            {isLoading ? "—" : totalAdmins}
          </p>
          <p className="text-[11px] text-slate-500">
            Nombre de comptes avec le rôle administrateur. À limiter au strict
            nécessaire pour des raisons de sécurité.
          </p>
        </div>
      </section>

      {/* Bloc tableau utilisateurs */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black">
            Utilisateurs
          </h2>
          {isLoading && (
            <span className="text-[11px] text-slate-500">
              Chargement en cours...
            </span>
          )}
        </div>

        {error && (
          <p className="text-[11px] text-red-600">
            {error}
          </p>
        )}

        {!isLoading && !error && users.length === 0 && (
          <p className="text-[11px] text-slate-500">
            Aucun utilisateur pour le moment.
          </p>
        )}

        {!isLoading && !error && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Rôle
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Email vérifié
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Créé le
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const created = user.createdAt
                    ? new Date(user.createdAt).toISOString().slice(0, 10)
                    : "—";
                  return (
                    <tr key={user.id} className="odd:bg-white even:bg-slate-50">
                      <td className="px-3 py-2 align-top text-slate-800">
                        {user.email}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {user.role || "user"}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {user.isEmailVerified ? "Oui" : "Non"}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {created}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboardPage;
