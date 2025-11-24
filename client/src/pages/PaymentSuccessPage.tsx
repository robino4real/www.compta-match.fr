import React from "react";
import { useNavigate } from "react-router-dom";

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <section className="bg-white border border-emerald-300 rounded-2xl p-5 shadow-sm space-y-2">
        <h1 className="text-xl font-semibold text-black">Paiement réussi</h1>
        <p className="text-xs text-slate-600">
          Votre paiement Stripe a été validé. La création définitive de la
          commande et l&apos;activation des liens de téléchargement seront
          implémentées dans un second temps dans votre espace client.
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <p className="text-xs text-slate-600">
          Vous pouvez dès maintenant retourner sur votre espace client ou
          consulter les autres logiciels disponibles.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/mon-compte")}
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition"
          >
            Aller à mon compte
          </button>
          <button
            type="button"
            onClick={() => navigate("/telechargements")}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-black hover:text-black transition"
          >
            Voir les logiciels téléchargeables
          </button>
        </div>
      </section>
    </div>
  );
};

export default PaymentSuccessPage;
