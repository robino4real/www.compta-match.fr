import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="space-y-8 text-slate-900">
      <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-4">
        <h1 className="text-2xl font-semibold text-black">Bienvenue chez COMPTAMATCH</h1>
        <p className="text-sm leading-relaxed text-slate-700">
          COMPTAMATCH accompagne les TPE, micro-entreprises et indépendants dans la gestion quotidienne de leur
          comptabilité. Notre équipe conçoit des outils sobres et efficaces pour vous aider à suivre vos flux, vos
          justificatifs et vos obligations en toute simplicité.
        </p>
        <p className="text-sm leading-relaxed text-slate-700">
          Nous pensons que la comptabilité ne doit pas être un obstacle mais un appui fiable. C&apos;est pourquoi nous
          proposons une application web en abonnement SaaS qui centralise vos données, vos justificatifs et vos
          déclarations afin de rester organisé jour après jour.
        </p>
        <p className="text-sm leading-relaxed text-slate-700">
          Pour les utilisateurs qui préfèrent travailler hors ligne, COMPTAMATCH distribue également des logiciels
          téléchargeables. Vous choisissez le format qui vous convient tout en bénéficiant du même niveau de clarté et
          d&apos;accompagnement.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold text-black">Application web de comptabilité (SaaS)</h2>
          <p className="text-sm leading-relaxed text-slate-700">
            Une interface en ligne, accessible sur abonnement, avec un espace client dédié pour suivre vos écritures,
            vos factures et vos documents. Les mises à jour sont automatiques et vos données restent disponibles à tout
            moment depuis votre navigateur.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold text-black">Logiciels téléchargeables</h2>
          <p className="text-sm leading-relaxed text-slate-700">
            Des outils à installer sur votre poste, tels que ComptaMini, proposés en achat unique. Une fois votre
            paiement confirmé, vous recevez le lien de téléchargement et pouvez travailler dans un environnement sobre,
            sans dépendre d&apos;une connexion continue.
          </p>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
        <h3 className="text-lg font-semibold text-black">Pourquoi choisir COMPTAMATCH ?</h3>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          <li>Simplicité d&apos;utilisation pensée pour les TPE et les indépendants.</li>
          <li>Tarifs ajustés pour respecter les budgets des petites structures.</li>
          <li>Données regroupées dans un espace client clair et accessible.</li>
          <li>Complémentarité entre l&apos;application web et les logiciels téléchargeables.</li>
        </ul>
      </section>
    </div>
  );
};

export default HomePage;
