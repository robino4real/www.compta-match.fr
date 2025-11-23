import React from 'react';

const ContactPage = () => (
  <div className="max-w-3xl mx-auto px-4 py-12">
    <h1 className="text-2xl font-bold text-slate-900">Contact</h1>
    <p className="text-slate-600 mt-2">Posez vos questions, l'équipe ComptaMatch vous répond rapidement.</p>
    <form className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Nom et prénom</label>
        <input className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2" placeholder="Votre nom" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2" placeholder="vous@exemple.fr" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Message</label>
        <textarea className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2" rows={4} placeholder="Votre besoin"></textarea>
      </div>
      <button type="submit" className="px-5 py-3 bg-primary text-white rounded-md font-semibold">
        Envoyer
      </button>
    </form>
  </div>
);

export default ContactPage;
