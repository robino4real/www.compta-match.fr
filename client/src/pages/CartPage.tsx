import React from 'react';
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';

const CartPage = () => {
  const { items, removeItem, total } = useCart();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Panier</h1>
      {items.length === 0 ? (
        <p className="mt-4 text-slate-600">Votre panier est vide.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{item.product.name}</p>
                <p className="text-slate-600 text-sm">{item.product.description}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">{item.product.price} €</p>
                <p className="text-sm text-slate-500">Quantité : {item.quantity}</p>
                <button onClick={() => removeItem(item.product.id)} className="text-red-600 text-sm mt-1">
                  Retirer
                </button>
              </div>
            </div>
          ))}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex justify-between items-center">
            <p className="text-lg font-semibold">Total TTC</p>
            <p className="text-xl font-bold text-primary">{total.toFixed(2)} €</p>
          </div>
          <div className="flex gap-3 justify-end">
            <Link to="/telechargements" className="px-4 py-2 border border-primary text-primary rounded-md">
              Continuer mes achats
            </Link>
            <button className="px-5 py-3 bg-primary text-white rounded-md font-semibold">Payer (Stripe test)</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
