import React from "react";
import { Link, useLocation, useNavigate, type Location } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";

const AuthLoginPage: React.FC = () => {
  const { user, login, isLoading } = useAuth();
  const { refreshAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [otpToken, setOtpToken] = React.useState<string | null>(null);
  const [otpCode, setOtpCode] = React.useState("");

  const state = location.state as { from?: Location; adminAccess?: boolean } | null;
  const adminQuery = React.useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get("admin") === "1";
  }, [location.search]);
  const isAdminRequest = Boolean(state?.adminAccess || adminQuery);

  const redirectPath = React.useMemo(() => {
    const fromPath = state?.from?.pathname;
    if (fromPath) {
      return fromPath;
    }

    return isAdminRequest ? "/admin" : "/compte";
  }, [isAdminRequest, state?.from?.pathname]);

  React.useEffect(() => {
    if (!isLoading && user) {
      navigate(redirectPath, { replace: true });
    }
  }, [isLoading, navigate, redirectPath, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const result = await login(email.trim(), password);

    if (result.success) {
      const isAdminUser = result.user?.role === "admin";

      if (isAdminRequest && !isAdminUser) {
        setError("Accès réservé à l'administrateur.");
        setIsSubmitting(false);
        navigate("/compte", { replace: true });
        return;
      }

      if (isAdminUser) {
        await refreshAdmin();
        navigate("/admin", { replace: true });
        return;
      }

      navigate(redirectPath, { replace: true });
      return;
    }

    if (result.status === "OTP_REQUIRED" && result.twoFactorToken) {
      setOtpToken(result.twoFactorToken);
      setSuccess(
        "Un code de vérification a été envoyé sur votre email administrateur."
      );
      setIsSubmitting(false);
      return;
    }

    setError(result.message || "Email ou mot de passe incorrect.");
    setIsSubmitting(false);
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!otpToken || !otpCode.trim()) {
      setError("Veuillez saisir le code reçu par email.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin-2fa-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ twoFactorToken: otpToken, code: otpCode.trim() }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        if (data?.user?.role !== "admin") {
          setError("Accès refusé.");
          setIsSubmitting(false);
          return;
        }

        setSuccess("Connexion réussie. Redirection en cours...");
        await refreshAdmin();
        window.setTimeout(() => {
          navigate("/admin", { replace: true });
        }, 600);
        return;
      }

      setError(data?.message ?? "Code invalide ou expiré.");
    } catch (err) {
      console.error("Admin OTP validation failed", err);
      setError("Impossible de valider le code. Merci de réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-white min-h-screen py-12">
      <div className="mx-auto w-full max-w-md px-4">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-black">
            {isAdminRequest ? "Connexion administrateur" : "Connexion"}
          </h1>
          <p className="text-sm text-slate-600">
            {isAdminRequest
              ? "Accès sécurisé au back-office ComptaMatch. Veuillez utiliser votre compte administrateur."
              : "Accédez à votre espace client ComptaMatch pour suivre vos commandes et abonnements."}
          </p>
        </div>

        {otpToken ? (
          <form
            onSubmit={handleOtpSubmit}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-black">
                Vérification administrateur
              </h2>
              <p className="text-sm text-slate-600">
                Un code de vérification vient d'être envoyé à {email || "votre email"}.
                Merci de le saisir pour accéder au back-office.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black" htmlFor="otpCode">
                Code reçu
              </label>
              <input
                id="otpCode"
                type="text"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="123456"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{success}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Vérification en cours..." : "Valider"}
            </button>
          </form>
        ) : (
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
            {success && <p className="text-sm text-emerald-600">{success}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>
        )}

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
