import React from 'react';
import { Link } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import { Product } from '../types/product';
import { useCart } from '../contexts/CartContext';

const products: Product[] = [
  {
    id: 'p1',
    name: 'ComptaMini Découverte (gratuit)',
    slug: 'comptamini-decouverte',
    description: "Version d'essai complète à 0 € pour tester les exports et le suivi de dépenses.",
    price: 0
  },
  {
    id: 'p2',
    name: 'ComptaMini - Edition comptabilité simplifiée',
    slug: 'comptamini-simplifiee',
    description: 'Pensé pour les micro-entrepreneurs avec TVA allégée.',
    price: 59
  },
  {
    id: 'p3',
    name: 'Pack TVA & déclaration',
    slug: 'pack-tva',
    description: 'Assistant de déclaration TVA avec exports FEC.',
    price: 99
  }
];

const DownloadsPage = () => {
  const { addItem } = useCart();
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <SectionTitle title="Logiciels téléchargeables" subtitle="Ajoutez un module spécialisé à votre boîte à outils" />
      <div className="grid md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
            <p className="text-slate-600 mt-2 flex-1">{product.description}</p>
            <p className="text-primary font-bold mt-4">{product.price} €</p>
            <div className="mt-4 flex gap-2">
              <Link
                to={`/produit/${product.id}`}
                className="flex-1 text-center px-4 py-2 border border-primary text-primary rounded-md"
              >
                Voir le produit
              </Link>
              <button
                onClick={() => addItem(product)}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-md font-semibold"
              >
                Ajouter au panier
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadsPage;
