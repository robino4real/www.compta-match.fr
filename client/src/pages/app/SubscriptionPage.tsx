import React from 'react';

const SubscriptionPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-slate-900">Mon abonnement</h1>
    <div className="bg-white p-4 rounded-lg border border-slate-100">
      <p className="font-semibold">Offre : Pro</p>
      <p className="text-slate-600">Statut : Actif</p>
      <p className="text-slate-600">Prochaine échéance : 15/07/2024</p>
      <button className="mt-4 px-4 py-2 border border-red-500 text-red-600 rounded-md">Résilier mon abonnement</button>
      <p className="text-xs text-slate-500 mt-2">
        La résiliation déclenche un webhook Stripe (simulé) et met immédiatement fin à l'accès Pro dans ce prototype.
      </p>
    </div>
  </div>
);

export default SubscriptionPage;
