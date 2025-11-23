import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Product } from '../types/product';
import { useCart } from '../contexts/CartContext';

const catalog: Record<string, Product> = {
  p1: {
    id: 'p1',
    name: 'ComptaMini Découverte (gratuit)',
    slug: 'comptamini-decouverte',
    description: 'Version 0 € pour tester la suite ComptaMatch : export PDF, saisie de dépenses et suivi trésorerie.',
    price: 0
  },
  p2: {
    id: 'p2',
    name: 'ComptaMini - Edition comptabilité simplifiée',
    slug: 'comptamini-simplifiee',
    description: 'Pensé pour les micro-entrepreneurs, sans complexité inutile et avec rappels fiscaux.',
    price: 59
  },
  p3: {
    id: 'p3',
    name: 'Pack TVA & déclaration',
    slug: 'pack-tva',
    description: 'Assistant TVA pas-à-pas avec exports FEC et contrôles automatiques.',
    price: 99
  }
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const product = (id && catalog[id]) || Object.values(catalog)[0];

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p>Produit introuvable.</p>
        <Link to="/telechargements" className="text-primary underline">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
        <p className="text-slate-600 mt-2">{product.description}</p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">Capture 1</div>
          <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">Capture 2</div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={() => addItem(product)} className="px-5 py-3 bg-primary text-white rounded-md font-semibold">
            Ajouter au panier
          </button>
          <Link to="/telechargements" className="px-5 py-3 border border-primary text-primary rounded-md">
            Retour au catalogue
          </Link>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Résumé</h3>
        <p className="text-primary text-2xl font-bold mt-2">{product.price} €</p>
        <p className="text-slate-600 mt-2">Licence téléchargeable incluant mises à jour pendant 12 mois.</p>
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p>• Livraison immédiate après paiement</p>
          <p>• Lien de téléchargement sécurisé</p>
          <p>• Assistance par email</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
