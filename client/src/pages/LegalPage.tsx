import React from 'react';

interface Props {
  title: string;
  slug: 'cgv' | 'mentions' | 'confidentialite';
}

const content: Record<Props['slug'], string[]> = {
  cgv: [
    'Ces conditions générales régissent les ventes des abonnements et des produits numériques ComptaMatch.',
    'Les paiements sont opérés via Stripe en mode test. Aucun remboursement n’est dû pour la période entamée.',
    'Le client s’engage à utiliser les logiciels dans un cadre professionnel conforme à la législation en vigueur.'
  ],
  mentions: [
    'ComptaMatch est édité par Exemple SAS, 10 rue de la Comptabilité, 75000 Paris.',
    'Directeur de la publication : Marie Dupont. Hébergement : Fournisseur Cloud européen.',
    'Pour toute question : contact@comptamatch.fr'
  ],
  confidentialite: [
    'Les données sont traitées conformément au RGPD. Elles sont utilisées pour fournir le service et la facturation.',
    'Vous pouvez exercer vos droits d’accès et de suppression en écrivant à dpo@comptamatch.fr.',
    'Les sous-traitants sont listés sur demande et font l’objet de clauses de confidentialité.'
  ]
};

const LegalPage: React.FC<Props> = ({ title, slug }) => (
  <div className="max-w-4xl mx-auto px-4 py-12">
    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
    <div className="mt-4 space-y-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      {content[slug].map((paragraph, idx) => (
        <p key={idx} className="text-slate-700 leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  </div>
);

export default LegalPage;
