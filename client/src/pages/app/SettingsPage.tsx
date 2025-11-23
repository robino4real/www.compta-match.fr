import React from 'react';

const SettingsPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-slate-900">Paramètres du compte</h1>
    <div className="bg-white p-4 rounded-lg border border-slate-100 space-y-3">
      <div>
        <p className="font-semibold">Profil</p>
        <p className="text-slate-600">Mettre à jour vos informations personnelles et changer votre mot de passe.</p>
      </div>
      <div>
        <p className="font-semibold">Sécurité</p>
        <p className="text-slate-600">Activation du 2FA (à implémenter) et gestion des sessions actives.</p>
      </div>
    </div>
  </div>
);

export default SettingsPage;
