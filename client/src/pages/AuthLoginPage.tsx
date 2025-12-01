import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClientAuth } from "../context/AuthContext";

const AuthLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useClientAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      navigate("/mon-compte", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (result.status === "OTP_REQUIRED") {
        navigate("/admin/login", {
          replace: true,
          state: {
            otpToken: result.twoFactorToken,
            email,
          },
        });
        return;
      }

      if (result.success) {
        const searchParams = new URLSearchParams(location.search);
        const redirectTo = searchParams.get("redirect") || "/mon-compte";
        setSuccess("Connexion réussie. Redirection en cours...");
        window.setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 600);
        return;
      }

      setError(result.message ?? "Email ou mot de passe incorrect.");
    } catch (err) {
      setError("Impossible de traiter la requête. Merci de réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-black">
            Se connecter à COMPTAMATCH
          </h1>
          <p className="text-xs text-slate-600">
            Accédez à votre espace client ou administrateur.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium text-black" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-black" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Votre mot de passe"
              required
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-emerald-600">{success}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Connexion en cours..." : "Se connecter"}
          </button>

          <p className="text-[11px] text-slate-600">
            Pas encore de compte ?{" "}
            <a href="/auth/register" className="font-semibold text-black hover:underline">
              Créer un compte
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthLoginPage;
