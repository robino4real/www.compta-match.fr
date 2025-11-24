import React from "react";
import { useAuth } from "../context/AuthContext";

const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const hasActiveSubscription = false; // TODO: remplacer par une vraie donnée depuis l'API

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr,0.9fr]">
      <section className="space-y-4">
        {!hasActiveSubscription && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div>
              <h1 className="text-base font-semibold text-black">
                COMPTABILITÉ – Offres d'application web
              </h1>
              <p className="text-xs text-slate-600">
                Choisissez la formule qui convient le mieux à votre activité. Vous pourrez ensuite
                accéder à l'application comptable depuis cet espace.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-black">Découverte</h2>
                  <p className="text-xs text-slate-600">Essai gratuit 7 jours pour démarrer en douceur.</p>
                </div>
                <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                  <li>Import rapide de vos écritures</li>
                  <li>Guides interactifs pour les TPE</li>
                  <li>Support par email inclus</li>
                  <li>Export PDF / Excel</li>
                </ul>
                <div className="text-sm font-semibold text-black">0€ pendant 7 jours</div>
                <button
                  type="button"
                  className="w-full rounded-full border border-black px-3 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white transition"
                  onClick={() => alert("TODO: tunnel de vente")}
                >
                  Essayer
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-black">Standard</h2>
                  <p className="text-xs text-slate-600">Idéal pour suivre votre comptabilité au quotidien.</p>
                </div>
                <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                  <li>Saisie guidée et rapprochement bancaire</li>
                  <li>Tableau de bord trésorerie</li>
                  <li>Support prioritaire</li>
                  <li>Collaboration avec votre expert-comptable</li>
                </ul>
                <div className="text-sm font-semibold text-black">39€ / mois</div>
                <button
                  type="button"
                  className="w-full rounded-full border border-black px-3 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white transition"
                  onClick={() => alert("TODO: tunnel de vente")}
                >
                  Essayer
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-black">Plus</h2>
                  <p className="text-xs text-slate-600">Pour les entreprises qui veulent aller plus loin.</p>
                </div>
                <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                  <li>Automatisations avancées</li>
                  <li>Gestion multi-utilisateurs</li>
                  <li>Suivi des immobilisations</li>
                  <li>Exports personnalisés</li>
                </ul>
                <div className="text-sm font-semibold text-black">69€ / mois</div>
                <button
                  type="button"
                  className="w-full rounded-full border border-black px-3 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white transition"
                  onClick={() => alert("TODO: tunnel de vente")}
                >
                  Essayer
                </button>
              </div>
            </div>

            {/* TODO: afficher un bloc d'accès direct si l'utilisateur possède déjà un abonnement actif */}
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold text-black">Informations du compte</h3>
          <p className="text-xs text-slate-700">Email : {user?.email}</p>
          <p className="text-xs text-slate-700">Type de compte : Standard (placeholder)</p>
          <p className="text-xs text-slate-700">Création : 12 janvier 2024 (placeholder)</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold text-black">Abonnement</h3>
          <p className="text-xs text-slate-700">Aucun abonnement actif pour l'instant.</p>
          <button
            type="button"
            className="rounded-full border border-black px-3 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white transition"
          >
            Gérer mon abonnement
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold text-black">COMPTABILITÉ</h3>
          <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
            <li>Accès à l'application web depuis cet espace</li>
            <li>Paramétrage en fonction de votre type d'entreprise</li>
            <li>Historique de vos actions</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default AccountPage;
