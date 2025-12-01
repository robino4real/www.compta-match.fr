import React from "react";
import { Link } from "react-router-dom";

const PaymentCancelPage: React.FC = () => {
  return (
    <main className="bg-slate-50 min-h-screen py-12">
      <div className="mx-auto max-w-3xl px-4 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:px-10 md:py-12">
          <span className="inline-flex w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Paiement interrompu
          </span>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">
            Paiement annulé
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700">
            Vous pouvez reprendre votre commande à tout moment. Vérifiez votre panier ou contactez notre équipe si vous avez rencontré un problème lors du paiement Stripe.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/commande"
              className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Reprendre la commande
            </Link>
            <Link
              to="/panier"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-black hover:text-black"
            >
              Retour au panier
            </Link>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Besoin d’aide ?</p>
            <p className="mt-1 text-sm text-slate-700">
              Notre support peut vous aider à finaliser votre achat ou à vérifier vos informations de facturation.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PaymentCancelPage;
