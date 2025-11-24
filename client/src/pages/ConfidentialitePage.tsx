import React from 'react';

const ConfidentialitePage: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold text-black">Politique de confidentialité</h1>
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-black">Collecte des données</h2>
        <p className="text-slate-700">
          Nous collectons uniquement les informations nécessaires à la fourniture du service et à la conformité légale.
        </p>
        <h2 className="text-xl font-semibold text-black">Utilisation</h2>
        <p className="text-slate-700">
          Les données sont utilisées pour assurer le bon fonctionnement de COMPTAMATCH, améliorer l'expérience utilisateur et
          envoyer des communications pertinentes.
        </p>
        <h2 className="text-xl font-semibold text-black">Droits des utilisateurs</h2>
        <p className="text-slate-700">
          Vous pouvez demander l'accès, la modification ou la suppression de vos données personnelles en nous contactant.
        </p>
      </div>
    </div>
  );
};

export default ConfidentialitePage;
