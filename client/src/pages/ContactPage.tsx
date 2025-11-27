import React from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

const ContactPage: React.FC = () => {
  const [contactEmail, setContactEmail] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchContact = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/public/contact`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || "Impossible de récupérer l'adresse de contact.");
        }
        setContactEmail(data.contactEmail || data.supportEmail || null);
      } catch (err: any) {
        setError(err?.message || "Erreur lors du chargement des informations de contact.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContact();
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-black">Contact</h1>
        <p className="text-slate-700">Une question ? Envoyez-nous un message, nous vous répondrons rapidement.</p>
        {contactEmail && (
          <p className="text-sm text-slate-700">
            Vous pouvez également nous écrire directement à{' '}
            <a className="underline" href={`mailto:${contactEmail}`}>
              {contactEmail}
            </a>.
          </p>
        )}
        {isLoading && <p className="text-xs text-slate-500">Chargement des informations de contact...</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
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
