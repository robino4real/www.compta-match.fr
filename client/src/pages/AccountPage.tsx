import React from "react";
import { useAuth } from "../context/AuthContext";

const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const hasActiveSubscription = false; // TODO: sera remplacé par une vraie info API plus tard

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr,0.9fr]">
      <section className="space-y-4">
        {!hasActiveSubscription && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h1 className="text-base font-semibold text-black">
                COMPTABILITÉ – Offres d&apos;application web
              </h1>
              <p className="text-xs text-slate-600">
                Choisissez une formule pour activer l&apos;application comptable dans votre espace client.
                Les textes et tarifs ci-dessous sont indicatifs et seront ajustés plus tard.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-black">Découverte (essai 7 jours)</h2>
                  <p className="text-xs text-slate-500">Pour tester l&apos;application sur vos premiers dossiers.</p>
                </div>
                <ul className="space-y-1 text-xs text-slate-500 list-disc list-inside">
                  <li>Accès guidé aux principales fonctionnalités</li>
                  <li>Support email pendant l&apos;essai</li>
                  <li>Exports simples (PDF/CSV)</li>
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
                  <p className="text-xs text-slate-500">Suivi comptable et facturation récurrente pour TPE.</p>
                </div>
                <ul className="space-y-1 text-xs text-slate-500 list-disc list-inside">
                  <li>Automatisations courantes et imports bancaires</li>
                  <li>Tableaux de bord trésorerie et TVA</li>
                  <li>Partage avec votre expert-comptable</li>
                  <li>Support prioritaire</li>
                </ul>
                <div className="text-sm font-semibold text-black">39€ / mois (indicatif)</div>
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
                  <p className="text-xs text-slate-500">Fonctionnalités avancées et équipes multi-utilisateurs.</p>
                </div>
                <ul className="space-y-1 text-xs text-slate-500 list-disc list-inside">
                  <li>Workflows personnalisables</li>
                  <li>Gestion des immobilisations et actifs</li>
                  <li>Exports avancés pour reporting</li>
                  <li>Support prioritaire dédié</li>
                </ul>
                <div className="text-sm font-semibold text-black">69€ / mois (indicatif)</div>
                <button
                  type="button"
                  className="w-full rounded-full border border-black px-3 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white transition"
                  onClick={() => alert("TODO: tunnel de vente")}
                >
                  Essayer
                </button>
              </div>
            </div>

            {/* TODO: afficher un bloc d'accès direct à l'application quand l'abonnement est actif */}
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold text-black">Informations du compte</h3>
          <p className="text-xs text-slate-700">Email : {user?.email}</p>
          <p className="text-xs text-slate-700">Type de compte : Standard</p>
          <p className="text-xs text-slate-500">Vous pourrez modifier certaines informations ultérieurement.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold text-black">Abonnement</h3>
          {!hasActiveSubscription ? (
            <>
              <p className="text-xs text-slate-700">Aucun abonnement actif pour l&apos;instant.</p>
              <button
                type="button"
                className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black transition"
                onClick={() => alert("TODO: gestion abonnement")}
              >
                Gérer mon abonnement
              </button>
            </>
          ) : (
            <p className="text-xs text-slate-700">Votre abonnement COMPTABILITÉ est actif.</p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <h3 className="text-sm font-semibold text-black">COMPTABILITÉ</h3>
          <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
            <li>Accès à l&apos;application comptable depuis cet espace une fois l&apos;abonnement actif.</li>
            <li>Paramétrages adaptés à votre type d&apos;entreprise (TODO).</li>
            <li>Historique des actions et des accès (TODO).</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default AccountPage;
