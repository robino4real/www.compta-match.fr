import React from "react";
import { Link, useLocation, useNavigate, type Location } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthLoginPage: React.FC = () => {
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const redirectPath = React.useMemo(() => {
    const state = location.state as { from?: Location } | null;
    return state?.from?.pathname || "/compte";
  }, [location.state]);

  React.useEffect(() => {
    if (!isLoading && user) {
      navigate(redirectPath, { replace: true });
    }
  }, [isLoading, navigate, redirectPath, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login(email.trim(), password);

    if (result.success) {
      navigate(redirectPath, { replace: true });
      return;
    }

    if (result.status === "OTP_REQUIRED") {
      setError(
        "Connexion administrateur détectée. Merci d'utiliser l'espace /admin."
      );
    } else {
      setError(result.message || "Email ou mot de passe incorrect.");
    }

    setIsSubmitting(false);
  };

  return (
    <main className="bg-white min-h-screen py-12">
      <div className="mx-auto w-full max-w-md px-4">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-black">Connexion</h1>
          <p className="text-sm text-slate-600">
            Accédez à votre espace client ComptaMatch pour suivre vos commandes
            et abonnements.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-black" htmlFor="email">
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
            <label
              className="text-sm font-medium text-black"
              htmlFor="password"
            >
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          <span>Besoin d'aide ? </span>
          <Link to="/" className="font-semibold text-black hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </main>
  );
};

export default AuthLoginPage;
