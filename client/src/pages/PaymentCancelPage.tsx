import React from "react";
import { useNavigate } from "react-router-dom";

const PaymentCancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <section className="bg-white border border-amber-300 rounded-2xl p-5 shadow-sm space-y-2">
        <h1 className="text-xl font-semibold text-black">Paiement annulé</h1>
        <p className="text-xs text-slate-600">
          Le paiement a été annulé ou interrompu. Aucun logiciel n&apos;a été
          facturé. Vous pouvez reprendre votre commande ou modifier votre
          panier.
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/panier")}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black transition"
          >
            Retourner au panier
          </button>
          <button
            type="button"
            onClick={() => navigate("/paiement")}
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition"
          >
            Revenir à la page de paiement
          </button>
        </div>
      </section>
    </div>
  );
};

export default PaymentCancelPage;
