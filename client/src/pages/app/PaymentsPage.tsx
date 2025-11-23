import React from 'react';

const payments = [
  { date: '15/05/2024', amount: '0 €', type: 'Abonnement Pro (démo gratuite)', invoice: '#FAC-20240515' },
  { date: '02/04/2024', amount: '0 €', type: 'ComptaMini Découverte (gratuit)', invoice: '#FAC-20240402' }
];

const PaymentsPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-slate-900">Mes factures / paiements</h1>
    <div className="bg-white p-4 rounded-lg border border-slate-100">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-2">Date</th>
            <th>Montant</th>
            <th>Type</th>
            <th>Facture</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.invoice} className="border-t border-slate-100">
              <td className="py-2">{p.date}</td>
              <td>{p.amount}</td>
              <td>{p.type}</td>
              <td>
                <button className="text-primary underline text-xs">Télécharger</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default PaymentsPage;
