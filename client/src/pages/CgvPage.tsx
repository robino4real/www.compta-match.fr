import React from 'react';

const CgvPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold text-black">Conditions générales de vente</h1>
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-black">1. Objet</h2>
        <p className="text-slate-700">
          Les présentes conditions générales définissent les règles applicables aux services COMPTAMATCH. Elles encadrent les
          droits et obligations des parties.
        </p>
        <h2 className="text-xl font-semibold text-black">2. Inscription</h2>
        <p className="text-slate-700">
          L'inscription au service implique l'acceptation pleine et entière des présentes conditions. Le client s'engage à fournir
          des informations exactes.
        </p>
        <h2 className="text-xl font-semibold text-black">3. Facturation</h2>
        <p className="text-slate-700">
          Les abonnements sont facturés selon la périodicité choisie. Toute période entamée est due dans son intégralité sauf
          disposition contraire.
        </p>
      </div>
    </div>
  );
};

export default CgvPage;
