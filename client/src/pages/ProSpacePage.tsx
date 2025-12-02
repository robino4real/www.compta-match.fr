import React from "react";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

interface SubscriptionPlan {
  id: string;
  name: string;
}

interface UserSubscription {
  id: string;
  plan?: SubscriptionPlan | null;
}

const ProSpacePage: React.FC = () => {
  const { user, login, isLoading: isAuthLoading } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [subscriptions, setSubscriptions] = React.useState<UserSubscription[]>([]);
  const [spacesError, setSpacesError] = React.useState<string | null>(null);
  const [isFetchingSpaces, setIsFetchingSpaces] = React.useState(false);

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

  const renderLoginForm = () => (
    <div className="mx-auto mt-10 w-full max-w-xl">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold text-slate-900">
            Connexion à l'espace ComptaPro
          </h2>
          <p className="text-sm text-slate-600">
            Réservé aux abonnés ComptaPro. Saisissez vos identifiants pour accéder à vos espaces dédiés.
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

    return (
      <section className="mt-12 space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Mes espaces ComptaPro
          </p>
          <p className="text-sm text-slate-600">
            Retrouvez vos abonnements et créez de nouveaux espaces pour chacune de vos structures.
          </p>
        </div>

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

          <div className="flex min-h-[220px] items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white text-6xl font-semibold text-slate-300">
            +
          </div>
        </div>

        {!isFetchingSpaces && !hasSubscriptions && !spacesError && (
          <p className="text-center text-sm text-slate-600">
            Aucun abonnement actif pour le moment. Commencez par créer votre premier espace.
          </p>
        )}
      </section>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <header className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Mon espace ComptaPro</h1>
          <p className="text-sm text-slate-600">
            Accès dédié aux abonnés ComptaPro. Merci de vous connecter pour continuer.
          </p>
        </header>

        {isAuthLoading && (
          <div className="mt-10 text-center text-sm text-slate-600">
            Vérification de votre session en cours...
          </div>
        )}

        {!isAuthLoading && !user && renderLoginForm()}

        {!isAuthLoading && user && renderSpaces()}
      </div>
    </main>
  );
};

export default ProSpacePage;
