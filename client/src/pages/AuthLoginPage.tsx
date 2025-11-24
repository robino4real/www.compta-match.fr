import React from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

const AuthLoginPage: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Veuillez renseigner votre email.");
      return;
    }

    if (!password) {
      setError("Veuillez renseigner votre mot de passe.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSuccess("Connexion réussie. Redirection en cours...");
        setTimeout(() => navigate("/"), 800);
      } else {
        setError(data?.message ?? "Une erreur est survenue. Veuillez réessayer.");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur. Veuillez réessayer plus tard.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-black">Connexion à votre espace COMPTAMATCH</h1>
          <p className="text-xs text-slate-600">
            Entrez votre email et votre mot de passe pour accéder à votre espace client.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-black">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="vous@example.com"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-black">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="********"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-emerald-600">{success}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-[11px] text-slate-600">
          Pas encore de compte ?{" "}
          <a href="/auth/register" className="font-semibold text-black hover:underline">
            Créer un compte
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthLoginPage;
