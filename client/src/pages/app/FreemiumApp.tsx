import React, { useState } from 'react';

interface Entry {
  date: string;
  label: string;
  amount: number;
  type: 'dépense' | 'recette';
}

const FreemiumApp = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [form, setForm] = useState<Entry>({ date: '', label: '', amount: 0, type: 'recette' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEntries((prev) => [...prev, form]);
    setForm({ date: '', label: '', amount: 0, type: 'recette' });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">App compta - Freemium</h1>
      <p className="text-slate-600">Ajoutez quelques mouvements simples. Données sauvegardées côté API dans un vrai projet.</p>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-3 bg-white p-4 rounded-lg border border-slate-100">
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="border border-slate-200 rounded-md px-3 py-2"
          required
        />
        <input
          placeholder="Libellé"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className="border border-slate-200 rounded-md px-3 py-2"
          required
        />
        <input
          type="number"
          placeholder="Montant"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          className="border border-slate-200 rounded-md px-3 py-2"
          required
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as Entry['type'] })}
          className="border border-slate-200 rounded-md px-3 py-2"
        >
          <option value="recette">Recette</option>
          <option value="dépense">Dépense</option>
        </select>
        <button type="submit" className="md:col-span-4 mt-2 px-4 py-2 bg-primary text-white rounded-md font-semibold">
          Enregistrer le mouvement
        </button>
      </form>

      <div className="bg-white p-4 rounded-lg border border-slate-100">
        <h3 className="font-semibold text-slate-900">Mouvements saisis</h3>
        <table className="min-w-full mt-3 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Date</th>
              <th>Libellé</th>
              <th>Montant</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr key={idx} className="border-t border-slate-100">
                <td className="py-2">{entry.date}</td>
                <td>{entry.label}</td>
                <td>{entry.amount} €</td>
                <td>{entry.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FreemiumApp;
