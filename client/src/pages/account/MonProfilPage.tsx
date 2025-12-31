import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const cards = [
  {
    title: "Abonnements",
    description: "Gérez vos abonnements actifs et suivez vos factures.",
    actionLabel: "Voir mes abonnements",
    href: "/compte/abonnements",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.6}
        stroke="currentColor"
        className="h-4 w-4 text-slate-900"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M4.5 9.75h15m-13.5 0h13.5v9a1.5 1.5 0 0 1-1.5 1.5h-10.5a1.5 1.5 0 0 1-1.5-1.5v-9Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 13.5h7.5" />
      </svg>
    ),
  },
  {
    title: "Mes commandes",
    description: "Suivez vos commandes et accédez à vos factures.",
    actionLabel: "Voir mes commandes",
    href: "/compte/commandes",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.6}
        stroke="currentColor"
        className="h-4 w-4 text-slate-900"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 5.25h18M8.25 5.25V4.5A2.25 2.25 0 0 1 10.5 2.25h3A2.25 2.25 0 0 1 15.75 4.5v.75M6 9.75h12l-.75 10.5h-10.5L6 9.75Z"
        />
      </svg>
    ),
  },
  {
    title: "Paramètres du compte",
    description:
      "Modifiez votre mot de passe, préférez les emails d’alerte et gérez vos préférences de communication.",
    actionLabel: "Gérer les paramètres",
    href: "/compte/parametres",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.6}
        stroke="currentColor"
        className="h-4 w-4 text-slate-900"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.094c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93l.847.36c.508.216.86.73.86 1.293v1.173c0 .563-.352 1.077-.86 1.293l-.847.36c-.396.166-.71.506-.78.93l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.02-.398-1.11-.94l-.149-.894a1.35 1.35 0 0 0-.78-.93l-.847-.36c-.508-.216-.86-.73-.86-1.293v-1.173c0-.563.352-1.077.86-1.293l.847-.36c.396-.166.71-.506.78-.93l.149-.894Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z" />
      </svg>
    ),
  },
  {
    title: "Informations personnelles",
    description: "Mettez à jour vos informations personnelles.",
    actionLabel: "Modifier mes informations",
    href: "/compte/informations",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.6}
        stroke="currentColor"
        className="h-4 w-4 text-slate-900"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.1a7.5 7.5 0 0 1 15 0v.15a.75.75 0 0 1-.75.75h-13.5a.75.75 0 0 1-.75-.75Z"
        />
      </svg>
    ),
  },
];

const MonProfilPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout("/");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="bg-white min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Mon profil
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <section
              key={card.title}
              className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm"
            >
              <div className="space-y-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/5">
                  {card.icon}
                </div>
                <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
                <p className="text-sm text-slate-600">{card.description}</p>
              </div>
              <button
                onClick={() => navigate(card.href)}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white hover:bg-slate-900"
                type="button"
              >
                {card.actionLabel}
              </button>
            </section>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-black hover:text-black"
            disabled={isLoggingOut}
            type="button"
          >
            {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
          </button>
        </div>
      </div>
    </main>
  );
};

export default MonProfilPage;
