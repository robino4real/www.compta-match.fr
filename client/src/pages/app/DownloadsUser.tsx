import React from 'react';

const downloads = [
  { name: 'ComptaMini - Edition comptabilité générale', date: '12/03/2024', status: 'Disponible' },
  { name: 'Pack TVA & déclaration', date: '02/04/2024', status: 'Disponible' }
];

const DownloadsUser = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-slate-900">Mes téléchargements</h1>
    <div className="bg-white p-4 rounded-lg border border-slate-100">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-2">Produit</th>
            <th>Date d'achat</th>
            <th>Statut</th>
            <th>Téléchargement</th>
          </tr>
        </thead>
        <tbody>
          {downloads.map((d) => (
            <tr key={d.name} className="border-t border-slate-100">
              <td className="py-2">{d.name}</td>
              <td>{d.date}</td>
              <td>{d.status}</td>
              <td>
                <button className="px-3 py-1 bg-primary text-white rounded-md text-xs">Lien sécurisé</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-500 mt-2">Les liens sont générés côté API après vérification de l'achat.</p>
    </div>
  </div>
);

export default DownloadsUser;
