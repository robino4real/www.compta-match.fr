import React from 'react';

const ContactPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-black">Contact</h1>
        <p className="text-slate-700">Une question ? Envoyez-nous un message, nous vous répondrons rapidement.</p>
      </div>

      <form className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-800">
            Nom complet
          </label>
          <input
            id="name"
            type="text"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-black focus:outline-none"
            placeholder="Votre nom"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-800">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-black focus:outline-none"
            placeholder="vous@example.com"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium text-slate-800">
            Message
          </label>
          <textarea
            id="message"
            rows={4}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-black focus:outline-none"
            placeholder="Décrivez votre besoin"
          />
        </div>
        <button
          type="button"
          className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black hover:border hover:border-black"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
};

export default ContactPage;
