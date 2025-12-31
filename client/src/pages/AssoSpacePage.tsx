import React from "react";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { buildPublicAppUrl } from "../lib/publicAppUrl";

interface SubscriptionPlan {
  id: string;
  name: string;
}

interface UserSubscription {
  id: string;
  plan?: SubscriptionPlan | null;
}

interface AppFicheSummary {
  id: string;
  name: string;
  type: "COMPTAPRO" | "COMPTASSO";
}

const AssoSpacePage: React.FC = () => {
  const { user, login, logout, isLoading: isAuthLoading } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [subscriptions, setSubscriptions] = React.useState<UserSubscription[]>([]);
  const [spacesError, setSpacesError] = React.useState<string | null>(null);
  const [isFetchingSpaces, setIsFetchingSpaces] = React.useState(false);

  const [appFiches, setAppFiches] = React.useState<AppFicheSummary[]>([]);
  const [isFetchingFiches, setIsFetchingFiches] = React.useState(false);
  const [ficheError, setFicheError] = React.useState<string | null>(null);

  const [isSpaceModalOpen, setIsSpaceModalOpen] = React.useState(false);
  const [spaceFormError, setSpaceFormError] = React.useState<string | null>(null);
  const [isSavingSpace, setIsSavingSpace] = React.useState(false);
  const [spaceForm, setSpaceForm] = React.useState({
    name: "",
    identifier: "",
    contactEmail: "",
    type: "Association",
  });

  const fetchSubscriptions = React.useCallback(async () => {
    if (!user) return;

    setIsFetchingSpaces(true);
    setSpacesError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/account/subscriptions`, {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de récupérer vos espaces.");
      }

      setSubscriptions((data?.subscriptions as UserSubscription[]) || []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur s'est produite lors du chargement de vos espaces.";
      setSpacesError(message);
      setSubscriptions([]);
    } finally {
      setIsFetchingSpaces(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const fetchAppFiches = React.useCallback(async () => {
    if (!user) return;

    setIsFetchingFiches(true);
    setFicheError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/app/fiches?type=COMPTASSO`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de récupérer vos fiches.");
      }

      setAppFiches((data?.fiches as AppFicheSummary[]) || []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur s'est produite lors du chargement de vos fiches.";
      setFicheError(message);
      setAppFiches([]);
    } finally {
      setIsFetchingFiches(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchAppFiches();
  }, [fetchAppFiches]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const result = await login(email.trim(), password);

    if (!result.success) {
      setFormError(result.message || "Identifiants incorrects.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  const handleOpenSpaceModal = () => {
    setSpaceFormError(null);
    setIsSpaceModalOpen(true);
  };

  const handleSpaceFormChange = (field: keyof typeof spaceForm, value: string) => {
    setSpaceForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleCustomSpaceSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!spaceForm.name.trim()) {
      setSpaceFormError("Merci de renseigner le nom de la structure.");
      return;
    }

    setIsSavingSpace(true);
    setSpaceFormError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/app/fiches`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: spaceForm.name.trim(), type: "COMPTASSO" }),
      });

      const data = await response.json();

      if (!response.ok || !data?.fiche) {
        throw new Error(data?.message || "Impossible de créer la fiche.");
      }

      setAppFiches((previous) => [data.fiche as AppFicheSummary, ...previous]);
      setIsSpaceModalOpen(false);
      setSpaceForm({
        name: "",
        identifier: "",
        contactEmail: "",
        type: "Association",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de créer la fiche pour le moment.";
      setSpaceFormError(message);
    } finally {
      setIsSavingSpace(false);
    }
  };

  const renderLoginForm = () => (
    <div className="mx-auto mt-10 w-full max-w-xl">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold text-slate-900">Connexion à l'espace ComptAsso</h2>
          <p className="text-sm text-slate-600">
            Réservé aux abonnés ComptAsso. Saisissez vos identifiants pour accéder à vos espaces dédiés.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="vous@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="••••••••"
            required
          />
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Connexion en cours..." : "Se connecter"}
        </button>
      </form>
    </div>
  );

  const renderSpaces = () => {
    const hasSubscriptions = subscriptions.length > 0;
    const hasAnySpaces = hasSubscriptions || appFiches.length > 0;

    const connectedUserName =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.email ||
      "Profil connecté";

    return (
      <section className="mt-12 space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Mes espaces ComptAsso
          </p>
          <p className="text-sm text-slate-600">
            Retrouvez vos abonnements et créez de nouveaux espaces pour chacune de vos structures.
          </p>
        </div>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fiches sécurisées ComptAsso
              </p>
              <p className="text-sm text-slate-600">
                Cliquez pour ouvrir la WebApp dans un nouvel onglet (accès protégé).
              </p>
            </div>
            {isFetchingFiches && (
              <span className="text-xs font-semibold text-slate-500">Chargement...</span>
            )}
          </div>

          {ficheError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {ficheError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {appFiches.map((fiche) => (
              <article
                key={fiche.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 px-5 py-4 shadow-sm transition hover:-translate-y-1 hover:border-black hover:shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">{fiche.name}</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Accès direct à la WebApp ComptAsso pour cette fiche.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    ID fiche : {fiche.id}
                  </div>
                  <a
                    href={buildPublicAppUrl(`/app/comptasso/${fiche.id}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                  >
                    Accéder
                  </a>
                </div>
              </article>
            ))}
          </div>

          {!isFetchingFiches && !ficheError && appFiches.length === 0 && (
            <p className="text-sm text-slate-600">
              Aucune fiche ComptAsso disponible pour le moment. Vous pourrez les ouvrir ici dès qu'elles seront créées.
            </p>
          )}
        </section>

        {spacesError && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {spacesError}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hasSubscriptions &&
            subscriptions.map((subscription, index) => (
              <article
                key={subscription.id}
                className="flex min-h-[220px] flex-col justify-between rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm"
              >
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Espace {index + 1}
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {subscription.plan?.name || "Espace dédié"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    Accessible uniquement à vous. Gérez vos documents et vos outils en toute sécurité.
                  </p>
                </div>
                <div className="text-xs text-slate-500">ID abonnement : {subscription.id}</div>
              </article>
            ))}

          <button
            type="button"
            onClick={handleOpenSpaceModal}
            className="group relative flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-white text-slate-400 transition duration-150 ease-out hover:-translate-y-1 hover:border-slate-500 hover:text-slate-500 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
            aria-label="Ajouter une nouvelle structure"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-5xl font-semibold transition duration-150 ease-out group-hover:scale-105 group-hover:bg-black group-hover:text-white">
              +
            </span>
            <span className="px-6 text-center text-sm font-semibold text-slate-600 transition duration-150 ease-out group-hover:text-slate-800">
              Ajouter une fiche association
            </span>
            <span className="text-xs text-slate-500">Cliquer pour renseigner vos informations</span>
          </button>
        </div>

        {!isFetchingSpaces && !hasAnySpaces && !spacesError && (
          <p className="text-center text-sm text-slate-600">
            Aucun abonnement actif pour le moment. Commencez par créer votre premier espace.
          </p>
        )}

        <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-900">{connectedUserName}</p>
            <p className="text-xs font-medium text-emerald-600">Connecté</p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-black hover:text-black"
          >
            Se déconnecter
          </button>
        </div>
      </section>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <header className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Mon espace ComptAsso</h1>
          <p className="text-sm text-slate-600">
            Accès dédié aux abonnés ComptAsso. Merci de vous connecter pour continuer.
          </p>
        </header>

        {isAuthLoading ? (
          <div className="mt-10 text-center text-sm text-slate-600">Chargement en cours...</div>
        ) : user ? (
          renderSpaces()
        ) : (
          renderLoginForm()
        )}
      </div>

      {isSpaceModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Ajouter une fiche association</h3>
                <p className="text-sm text-slate-600">
                  Indiquez la structure à laquelle ce cadre sera rattaché pour retrouver vos documents.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSpaceModalOpen(false)}
                className="text-xs font-semibold text-slate-600 hover:text-black"
              >
                Fermer
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleCustomSpaceSubmit}>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700" htmlFor="asso-space-name">
                  Nom de l'association
                </label>
                <input
                  id="asso-space-name"
                  type="text"
                  value={spaceForm.name}
                  onChange={(event) => handleSpaceFormChange("name", event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="Ex : Les Amis de la Nature"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="asso-space-identifier">
                    RNA / SIREN (optionnel)
                  </label>
                  <input
                    id="asso-space-identifier"
                    type="text"
                    value={spaceForm.identifier}
                    onChange={(event) => handleSpaceFormChange("identifier", event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="Ex : W123456789"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="asso-space-contact">
                    Email de contact (optionnel)
                  </label>
                  <input
                    id="asso-space-contact"
                    type="email"
                    value={spaceForm.contactEmail}
                    onChange={(event) => handleSpaceFormChange("contactEmail", event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="contact@asso.fr"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700" htmlFor="asso-space-type">
                  Type de structure
                </label>
                <input
                  id="asso-space-type"
                  type="text"
                  value={spaceForm.type}
                  onChange={(event) => handleSpaceFormChange("type", event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="Association, fondation..."
                />
              </div>

              {spaceFormError && <p className="text-sm text-red-600">{spaceFormError}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSpaceModalOpen(false)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-black hover:text-black"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingSpace}
                  className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingSpace ? "Création en cours..." : "Créer le cadre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default AssoSpacePage;
