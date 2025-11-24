import React from 'react';

const MentionsLegalesPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold text-black">Mentions légales</h1>
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-black">Editeur du site</h2>
        <p className="text-slate-700">COMPTAMATCH, société spécialisée dans la gestion comptable et numérique.</p>
        <h2 className="text-xl font-semibold text-black">Contact</h2>
        <p className="text-slate-700">Email : contact@comptamatch.fr • Téléphone : +33 1 23 45 67 89</p>
        <h2 className="text-xl font-semibold text-black">Hébergement</h2>
        <p className="text-slate-700">Le site est hébergé auprès d'un prestataire européen garantissant la sécurité des données.</p>
      </div>
    </div>
  );
};

export default MentionsLegalesPage;
