import React from "react";
import { useNavigate } from "react-router-dom";
import PageRenderer from "../components/pageBuilder/PageRenderer";
import { useCustomPage } from "../hooks/useCustomPage";

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: builderData, isLoading } = useCustomPage("/tarifs");

  const shouldRenderBuilder =
    builderData && Array.isArray(builderData.sections) && builderData.sections.length > 0;

  const handleTryOffer = (planId: "decouverte" | "essentielle" | "avancee") => {
    // TODO: plus tard,
    // - si l'utilisateur est déjà connecté : lancer un processus de paiement / activation spécifique au plan
    // - sinon : rediriger vers une page de connexion / création de compte puis revenir sur le plan choisi
    navigate("/auth/login");
  };

  if (isLoading && !shouldRenderBuilder) {
    return (
      <div className="py-12 text-center text-sm text-slate-600">Chargement de la page...</div>
    );
  }

  if (shouldRenderBuilder) {
    return <PageRenderer page={builderData!.page} sections={builderData!.sections} />;
  }

  return (
    <div className="space-y-8">
      {/* Titre + intro */}
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-black">
          Nos offres d&apos;application web COMPTAMATCH
        </h1>
        <p className="text-sm text-slate-600">
          Choisissez le niveau d&apos;accompagnement qui correspond à votre TPE : une offre
          Découverte pour tester l&apos;outil, puis des offres Essentielle et Avancée avec
          davantage d&apos;options et de confort.
        </p>
      </section>

      {/* Grille des 3 offres */}
      <section className="grid gap-6 md:grid-cols-3">
        {/* Carte Découverte */}
        <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-black">Découverte</h2>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
            Pour découvrir l&apos;outil en douceur
          </p>

          <div className="mt-4">
            <p className="text-2xl font-semibold text-black">Gratuit</p>
            <p className="text-xs text-slate-500">Accès freemium à l&apos;app web</p>
          </div>

          <ul className="mt-4 space-y-1 text-xs text-slate-500">
            <li>• Accès à une version limitée de l’app web</li>
            <li>• Nombre d’écritures limité</li>
            <li>• Paramétrage de base pour TPE</li>
            <li>• Idéal pour tester le fonctionnement</li>
          </ul>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => handleTryOffer("decouverte")}
              className="w-full rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition"
            >
              Essayer
            </button>
          </div>
        </div>

        {/* Carte Essentielle */}
        <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-black">Essentielle</h2>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
            Pour une gestion simple au quotidien
          </p>

          <div className="mt-4">
            <p className="text-2xl font-semibold text-black">À partir de 19 € HT / mois</p>
            <p className="text-xs text-slate-500">Abonnement application web</p>
          </div>

          <ul className="mt-4 space-y-1 text-xs text-slate-500">
            <li>• Accès complet aux fonctions principales</li>
            <li>• Volume d’écritures plus large</li>
            <li>• Quelques rapports et exports</li>
            <li>• Support par email</li>
          </ul>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => handleTryOffer("essentielle")}
              className="w-full rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition"
            >
              Essayer
            </button>
          </div>
        </div>

        {/* Carte Avancée */}
        <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-black">Avancée</h2>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
            Pour aller plus loin dans le suivi
          </p>

          <div className="mt-4">
            <p className="text-2xl font-semibold text-black">À partir de 39 € HT / mois</p>
            <p className="text-xs text-slate-500">Plus d’options et de confort</p>
          </div>

          <ul className="mt-4 space-y-1 text-xs text-slate-500">
            <li>• Plus de rapports et de filtres</li>
            <li>• Paramétrages plus poussés</li>
            <li>• Priorité support</li>
            <li>• Pensé pour les TPE avec plus d’activité</li>
          </ul>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => handleTryOffer("avancee")}
              className="w-full rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition"
            >
              Essayer
            </button>
          </div>
        </div>
      </section>

      {/* Petite note en bas */}
      <section className="text-xs text-slate-500">
        <p>
          Les informations ci-dessus sont indicatives et pourront être ajustées. Les offres concernent
          uniquement l&apos;application web COMPTAMATCH. Les logiciels téléchargeables disposent de
          leurs propres tarifs et pages dédiées.
        </p>
      </section>
    </div>
  );
};

export default PricingPage;
