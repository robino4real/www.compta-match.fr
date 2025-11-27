import React from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

const AuthLoginPage: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [otpToken, setOtpToken] = React.useState<string | null>(null);
  const [otpCode, setOtpCode] = React.useState("");

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
        setSuccess("Connexion réussie. Redirection en cours...");
        window.setTimeout(() => {
          window.location.href = "/";
        }, 600);
        return;
      }

      setError(data?.message ?? "Email ou mot de passe incorrect.");
    } catch (err) {
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
        setSuccess("Code validé. Redirection en cours...");
        window.setTimeout(() => {
          window.location.href = "/admin";
        }, 600);
        return;
      }

      setError(data?.message ?? "Code invalide ou expiré.");
      if (response.status === 410 || response.status === 429) {
        setOtpToken(null);
        setOtpCode("");
      }
    } catch (err) {
      setError("Impossible de vérifier le code. Merci de réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-black">
            Connexion à votre espace COMPTAMATCH
          </h1>
          <p className="text-xs text-slate-600">
            Entrez votre email et votre mot de passe pour accéder à votre espace client.
          </p>
        </div>

        {!otpToken ? (
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
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>

            <p className="text-[11px] text-slate-600">
              Pas encore de compte ?{" "}
              <a href="/auth/register" className="font-semibold text-black hover:underline">
                Créer un compte
              </a>
            </p>
          </form>
        ) : (
          <form
            onSubmit={handleOtpSubmit}
            className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm space-y-4"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black">Vérification 2FA</p>
              <p className="text-xs text-slate-700">
                Un code à 6 chiffres vous a été envoyé. Saisissez-le pour accéder au back-office.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-black" htmlFor="otp-code">
                Code reçu par email
              </label>
              <input
                id="otp-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
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
              {isSubmitting ? "Vérification..." : "Valider le code"}
            </button>
            <p className="text-[11px] text-slate-600">
              Code expiré ou incorrect ?{' '}
              <button
                type="button"
                className="font-semibold text-black hover:underline"
                onClick={() => {
                  setOtpToken(null);
                  setOtpCode("");
                  setSuccess(null);
                  setError(null);
                }}
              >
                Revenir à la connexion
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthLoginPage;
