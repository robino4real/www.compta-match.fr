import React from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { useAdminAuth } from "../../context/AdminAuthContext";

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { admin, isLoading, refreshAdmin } = useAdminAuth();
  const [email, setEmail] = React.useState("admin-user@compta-match.fr");
  const [password, setPassword] = React.useState("");
  const [otpToken, setOtpToken] = React.useState<string | null>(null);
  const [otpCode, setOtpCode] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoading && admin) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [admin, isLoading, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError("Email et mot de passe requis.");
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

      const data = await response.json().catch(() => null);

      if (data?.status === "OTP_REQUIRED" && data.twoFactorToken) {
        setOtpToken(data.twoFactorToken);
        setSuccess(null);
        setError(null);
        return;
      }

      if (response.ok) {
        if (data?.user?.role !== "admin") {
          setError("Accès réservé à l'administrateur.");
          return;
        }

        await refreshAdmin();
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      setError(data?.message ?? "Email ou mot de passe incorrect.");
    } catch (err) {
      console.error("Admin login failed", err);
      setError("Impossible de traiter la requête. Merci de réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!otpToken || !otpCode.trim()) {
      setError("Veuillez saisir le code reçu par email.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

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
          return;
        }

        setSuccess("Connexion réussie. Redirection en cours...");
        await refreshAdmin();
        window.setTimeout(() => {
          navigate("/admin/dashboard", { replace: true });
        }, 300);
        return;
      }

      setError(data?.message ?? "Code invalide.");
    } catch (err) {
      console.error("Admin OTP verification failed", err);
      setError("Impossible de traiter la requête. Merci de réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10 text-xs text-slate-600">
        Vérification de votre session en cours...
      </div>
    );
  }

  if (otpToken) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-black">Vérification requise</h1>
            <p className="text-xs text-slate-600">
              Un code de vérification vient d'être envoyé sur votre email personnel.
              Saisissez-le ci-dessous pour finaliser la connexion administrateur.
            </p>
          </div>

          <form
            onSubmit={handleOtpSubmit}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4"
          >
            <div className="space-y-1">
              <label className="text-sm font-medium text-black" htmlFor="otpCode">
                Code reçu
              </label>
              <input
                id="otpCode"
                type="text"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="123456"
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
              {isSubmitting ? "Vérification en cours..." : "Valider"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-black">Connexion administrateur</h1>
          <p className="text-xs text-slate-600">
            Accès sécurisé réservé au back-office ComptaMatch.
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
              placeholder="admin-user@compta-match.fr"
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
              placeholder="Votre mot de passe administrateur"
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
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
