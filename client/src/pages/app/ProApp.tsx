import React, { useState } from 'react';

interface EntryPro {
  date: string;
  label: string;
  debit: string;
  credit: string;
  amount: number;
  tva: number;
}

const ProApp = () => {
  const [entries, setEntries] = useState<EntryPro[]>([]);
  const [form, setForm] = useState<EntryPro>({ date: '', label: '', debit: '512', credit: '706', amount: 0, tva: 20 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEntries((prev) => [...prev, form]);
    setForm({ date: '', label: '', debit: '512', credit: '706', amount: 0, tva: 20 });
  };

  const totalHT = entries.reduce((acc, e) => acc + e.amount, 0);
  const totalTVA = entries.reduce((acc, e) => acc + (e.amount * e.tva) / 100, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">App compta - Version Pro</h1>
      <p className="text-slate-600">Accès réservé aux abonnements actifs. Exemple de saisie comptable avancée.</p>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-6 gap-3 bg-white p-4 rounded-lg border border-slate-100 text-sm">
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="border border-slate-200 rounded-md px-2 py-2"
          required
        />
        <input
          placeholder="Libellé"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className="border border-slate-200 rounded-md px-2 py-2"
          required
        />
        <input
          placeholder="Compte débit"
          value={form.debit}
          onChange={(e) => setForm({ ...form, debit: e.target.value })}
          className="border border-slate-200 rounded-md px-2 py-2"
          required
        />
        <input
          placeholder="Compte crédit"
          value={form.credit}
          onChange={(e) => setForm({ ...form, credit: e.target.value })}
          className="border border-slate-200 rounded-md px-2 py-2"
          required
        />
        <input
          type="number"
          placeholder="Montant HT"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          className="border border-slate-200 rounded-md px-2 py-2"
          required
        />
        <input
          type="number"
          placeholder="TVA %"
          value={form.tva}
          onChange={(e) => setForm({ ...form, tva: Number(e.target.value) })}
          className="border border-slate-200 rounded-md px-2 py-2"
        />
        <button type="submit" className="md:col-span-6 px-4 py-2 bg-primary text-white rounded-md font-semibold">
          Enregistrer dans le journal
        </button>
      </form>

      <div className="bg-white p-4 rounded-lg border border-slate-100">
        <h3 className="font-semibold text-slate-900">Journal Pro</h3>
        <table className="min-w-full mt-3 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Date</th>
              <th>Libellé</th>
              <th>Débit</th>
              <th>Crédit</th>
              <th>Montant HT</th>
              <th>TVA</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr key={idx} className="border-t border-slate-100">
                <td className="py-2">{entry.date}</td>
                <td>{entry.label}</td>
                <td>{entry.debit}</td>
                <td>{entry.credit}</td>
                <td>{entry.amount} €</td>
                <td>{entry.tva}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex gap-4 text-sm text-slate-700">
          <p>Total HT : {totalHT.toFixed(2)} €</p>
          <p>TVA : {totalTVA.toFixed(2)} €</p>
          <p>Total TTC : {(totalHT + totalTVA).toFixed(2)} €</p>
        </div>
      </div>
    </div>
  );
};

export default ProApp;
