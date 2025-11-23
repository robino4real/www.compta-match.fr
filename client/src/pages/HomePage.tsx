import React from 'react';
import SectionTitle from '../components/SectionTitle';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Automatisation comptable',
    description: 'Générez automatiquement journal, grand livre et bilan en quelques clics.'
  },
  {
    title: 'Collaboratif',
    description: 'Invitez votre expert-comptable et partagez les documents sécurisés.'
  },
  {
    title: 'Sécurité avancée',
    description: 'Stockage chiffré, authentification forte et alertes temps réel.'
  }
];

const steps = [
  { title: 'Créer un compte', desc: 'Inscrivez-vous en moins de 2 minutes.' },
  { title: 'Choisir une offre', desc: 'Démarrez en freemium ou passez en Pro.' },
  { title: "Utiliser l'app", desc: 'Suivez vos finances et exportez vos rapports.' }
];

const HomePage = () => (
  <div>
    <div className="bg-gradient-to-r from-primary to-blue-600 text-white">
      <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-sm uppercase tracking-wide text-blue-100">SaaS comptable moderne</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-4">Logiciel de gestion comptable pour TPE</h1>
          <p className="mt-4 text-blue-100">
            Simplifiez votre comptabilité avec ComptaMatch : automatisation, contrôle et documents prêts pour votre expert-comptable.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/auth/register" className="bg-accent text-white px-5 py-3 rounded-md font-semibold">
              Essayer gratuitement
            </Link>
            <Link to="/tarifs" className="bg-white/10 border border-white/40 px-5 py-3 rounded-md font-semibold">
              Découvrir les offres
            </Link>
          </div>
          <div className="mt-4 text-xs text-blue-100 space-y-1">
            <p>Journal, grand livre, bilan : tout est généré automatiquement.</p>
            <p>Offre Pro en démonstration à 0 € / mois + un logiciel téléchargeable gratuit.</p>
          </div>
        </div>
        <div className="bg-white text-slate-900 rounded-xl shadow-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Suivi de trésorerie en temps réel</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-slate-500">Solde bancaire</p>
              <p className="text-2xl font-bold text-primary">12 450 €</p>
            </div>
            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-slate-500">TVA estimée</p>
              <p className="text-2xl font-bold text-amber-600">2 180 €</p>
            </div>
            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-slate-500">Factures clients</p>
              <p className="text-2xl font-bold text-emerald-600">36 en cours</p>
            </div>
            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-slate-500">Alertes</p>
              <p className="text-2xl font-bold text-rose-600">2 à traiter</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">Les données affichées sont simulées pour la démonstration.</p>
        </div>
      </div>
    </div>

    <div className="max-w-6xl mx-auto px-4 py-14">
      <SectionTitle title="Fonctionnalités principales" subtitle="Pensées pour les dirigeants de TPE" />
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div key={feature.title} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-primary">{feature.title}</h3>
            <p className="text-slate-600 mt-2">{feature.description}</p>
          </div>
        ))}
      </div>

      <SectionTitle title="Comment ça marche ?" />
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <div key={step.title} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-white font-semibold mb-3">
              {index + 1}
            </div>
            <h4 className="text-lg font-semibold">{step.title}</h4>
            <p className="text-slate-600 mt-2">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link to="/auth/register" className="px-6 py-3 bg-primary text-white rounded-md font-semibold">
          Essayer gratuitement
        </Link>
      </div>

      <div className="mt-12 flex justify-center gap-6 text-sm text-slate-600">
        <Link to="/cgv" className="hover:text-primary">
          CGV
        </Link>
        <Link to="/mentions-legales" className="hover:text-primary">
          Mentions légales
        </Link>
        <Link to="/confidentialite" className="hover:text-primary">
          Politique de confidentialité
        </Link>
      </div>
    </div>
  </div>
);

export default HomePage;
