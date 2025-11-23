import React from 'react';
import { Link } from 'react-router-dom';

const DashboardHome = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
        <p className="text-sm text-slate-500">Statut abonnement</p>
        <p className="text-lg font-semibold text-emerald-600">Actif - Pro</p>
      </div>
      <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
        <p className="text-sm text-slate-500">Paiements</p>
        <p className="text-lg font-semibold">2 derniers mois payés</p>
      </div>
      <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
        <p className="text-sm text-slate-500">Téléchargements</p>
        <p className="text-lg font-semibold">3 logiciels acquis</p>
      </div>
    </div>
    <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
      <p className="font-semibold">Accès rapide</p>
      <div className="flex gap-3 mt-3">
        <Link to="/app/freemium" className="px-4 py-2 bg-primary text-white rounded-md text-sm">
          App Freemium
        </Link>
        <Link to="/app/pro" className="px-4 py-2 border border-primary text-primary rounded-md text-sm">
          App Pro
        </Link>
      </div>
    </div>
  </div>
);

export default DashboardHome;
