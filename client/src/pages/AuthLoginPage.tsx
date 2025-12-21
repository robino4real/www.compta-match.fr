import React from "react";
import { Link, useLocation, useNavigate, type Location } from "react-router-dom";
import { buildApiUrl } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";

const AuthLoginPage: React.FC = () => {
  const { user, login, register, isLoading } = useAuth();
  const { refreshAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [mode, setMode] = React.useState<"login" | "register">("login");
  const [registerForm, setRegisterForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    accountType: "PROFESSIONAL" as "PROFESSIONAL" | "ASSOCIATION" | "INDIVIDUAL",
    companyName: "",
    vatNumber: "",
    siret: "",
    address1: "",
    address2: "",
    postalCode: "",
    city: "",
    country: "France",
    phone: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = React.useState(false);
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

  React.useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [mode]);

  const handleRegisterChange = (
    field: keyof typeof registerForm,
    value: string
  ) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setMode("login");
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

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsRegisterSubmitting(true);

    if (
      !registerForm.firstName.trim() ||
      !registerForm.lastName.trim() ||
      !registerForm.email.trim() ||
      !registerForm.password.trim() ||
      !registerForm.address1.trim() ||
      !registerForm.postalCode.trim() ||
      !registerForm.city.trim() ||
      !registerForm.country.trim()
    ) {
      setError("Merci de compléter toutes les informations obligatoires.");
      setIsRegisterSubmitting(false);
      return;
    }

    const result = await register({
      email: registerForm.email.trim(),
      password: registerForm.password,
      firstName: registerForm.firstName.trim(),
      lastName: registerForm.lastName.trim(),
      accountType: registerForm.accountType,
      address1: registerForm.address1.trim(),
      address2: registerForm.address2.trim() || undefined,
      postalCode: registerForm.postalCode.trim(),
      city: registerForm.city.trim(),
      country: registerForm.country.trim(),
      companyName: registerForm.companyName.trim() || undefined,
      vatNumber: registerForm.vatNumber.trim() || undefined,
      siret: registerForm.siret.trim() || undefined,
      phone: registerForm.phone.trim() || undefined,
    });

    if (result.success) {
      setIsRegisterSubmitting(false);
      navigate(redirectPath, { replace: true });
      return;
    }

    setError(result.message || "Impossible de créer le compte.");
    setIsRegisterSubmitting(false);
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
      const response = await fetch(buildApiUrl("/auth/admin-2fa-verify"), {
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
        <div className="mb-8 space-y-3 text-center">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm font-semibold text-slate-700">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-full px-3 py-1 transition ${
                mode === "login" ? "bg-black text-white" : "hover:bg-slate-100"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpToken(null);
                setMode("register");
              }}
              className={`rounded-full px-3 py-1 transition ${
                mode === "register" ? "bg-black text-white" : "hover:bg-slate-100"
              }`}
            >
              Créer un compte
            </button>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-black">
              {mode === "register" ? "Inscription" : isAdminRequest ? "Connexion administrateur" : "Connexion"}
            </h1>
            <p className="text-sm text-slate-600">
              {mode === "register"
                ? "Créez votre compte, renseignez vos informations de facturation et choisissez votre statut."
                : isAdminRequest
                ? "Accès sécurisé au back-office ComptaMatch. Veuillez utiliser votre compte administrateur."
                : "Accédez à votre espace client ComptaMatch pour suivre vos commandes et abonnements."}
            </p>
          </div>
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
          <>
            {mode === "login" ? (
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
            ) : (
              <form
                onSubmit={handleRegisterSubmit}
                className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black" htmlFor="firstName">
                      Prénom
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={registerForm.firstName}
                      onChange={(event) => handleRegisterChange("firstName", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black" htmlFor="lastName">
                      Nom
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={registerForm.lastName}
                      onChange={(event) => handleRegisterChange("lastName", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black" htmlFor="registerEmail">
                      Email
                    </label>
                    <input
                      id="registerEmail"
                      type="email"
                      autoComplete="email"
                      value={registerForm.email}
                      onChange={(event) => handleRegisterChange("email", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="vous@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black" htmlFor="registerPassword">
                      Mot de passe
                    </label>
                    <input
                      id="registerPassword"
                      type="password"
                      autoComplete="new-password"
                      value={registerForm.password}
                      onChange={(event) => handleRegisterChange("password", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black" htmlFor="accountType">
                    Statut du compte
                  </label>
                  <select
                    id="accountType"
                    value={registerForm.accountType}
                    onChange={(event) =>
                      handleRegisterChange(
                        "accountType",
                        event.target.value as "PROFESSIONAL" | "ASSOCIATION" | "INDIVIDUAL"
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="PROFESSIONAL">Professionnel</option>
                    <option value="ASSOCIATION">Association</option>
                    <option value="INDIVIDUAL">Particulier</option>
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black" htmlFor="companyName">
                      Société (optionnel)
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      value={registerForm.companyName}
                      onChange={(event) => handleRegisterChange("companyName", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Ma société"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black" htmlFor="vatNumber">
                      N° TVA (optionnel)
                    </label>
                    <input
                      id="vatNumber"
                      type="text"
                      value={registerForm.vatNumber}
                      onChange={(event) => handleRegisterChange("vatNumber", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="FRXX999999999"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black" htmlFor="address1">
                    Adresse de facturation
                  </label>
                  <input
                    id="address1"
                    type="text"
                    value={registerForm.address1}
                    onChange={(event) => handleRegisterChange("address1", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="12 rue Exemple"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black" htmlFor="address2">
                    Complément d'adresse (optionnel)
                  </label>
                  <input
                    id="address2"
                    type="text"
                    value={registerForm.address2}
                    onChange={(event) => handleRegisterChange("address2", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Bâtiment, étage, etc."
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-1 space-y-2">
                    <label className="text-sm font-medium text-black" htmlFor="postalCode">
                      Code postal
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      value={registerForm.postalCode}
                      onChange={(event) => handleRegisterChange("postalCode", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                  <div className="sm:col-span-1 space-y-2">
                    <label className="text-sm font-medium text-black" htmlFor="city">
                      Ville
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={registerForm.city}
                      onChange={(event) => handleRegisterChange("city", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                  <div className="sm:col-span-1 space-y-2">
                    <label className="text-sm font-medium text-black" htmlFor="country">
                      Pays
                    </label>
                    <input
                      id="country"
                      type="text"
                      value={registerForm.country}
                      onChange={(event) => handleRegisterChange("country", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black" htmlFor="siret">
                      SIRET (optionnel)
                    </label>
                    <input
                      id="siret"
                      type="text"
                      value={registerForm.siret}
                      onChange={(event) => handleRegisterChange("siret", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black" htmlFor="phone">
                      Téléphone (optionnel)
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={registerForm.phone}
                      onChange={(event) => handleRegisterChange("phone", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-emerald-600">{success}</p>}

                <button
                  type="submit"
                  disabled={isRegisterSubmitting}
                  className="flex w-full items-center justify-center rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRegisterSubmitting ? "Création du compte..." : "Créer mon compte"}
                </button>
              </form>
            )}
          </>
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
