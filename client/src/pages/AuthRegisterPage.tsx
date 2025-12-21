import React from "react";
import { Link, useLocation, useNavigate, type Location } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthRegisterPage: React.FC = () => {
  const { user, register, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const state = location.state as { from?: Location } | null;

  const redirectPath = React.useMemo(() => {
    const fromPath = state?.from?.pathname;
    if (fromPath) {
      return fromPath;
    }

    return "/compte";
  }, [state?.from?.pathname]);

  React.useEffect(() => {
    if (!isLoading && user) {
      navigate(redirectPath, { replace: true });
    }
  }, [isLoading, navigate, redirectPath, user]);

  const handleRegisterChange = (
    field: keyof typeof registerForm,
    value: string
  ) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

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
      setIsSubmitting(false);
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
      setSuccess("Compte créé. Redirection en cours...");
      setIsSubmitting(false);
      navigate(redirectPath, { replace: true });
      return;
    }

    setError(result.message || "Impossible de créer le compte.");
    setIsSubmitting(false);
  };

  return (
    <main className="bg-white min-h-screen py-12">
      <div className="mx-auto w-full max-w-md px-4">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-black">Inscription</h1>
          <p className="text-sm text-slate-600">
            Créez votre compte, renseignez vos informations de facturation et choisissez votre statut.
          </p>
        </div>

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
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          <span>Vous avez déjà un compte ? </span>
          <Link to="/auth/login" className="font-semibold text-black hover:underline">
            Connectez-vous ici
          </Link>
        </div>
      </div>
    </main>
  );
};

export default AuthRegisterPage;
