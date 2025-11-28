import React from "react";

const faqs = [
  {
    question: "Comment changer le logo de la barre supérieure ?",
    answer:
      "Depuis l'espace administrateur, ouvrez la page d'accueil et renseignez l'URL du logo dans la section Identité visuelle.",
  },
  {
    question: "Puis-je personnaliser l'icône de l'onglet navigateur ?",
    answer:
      "Oui, ajoutez l'URL d'un fichier .ico, .png ou .svg dans le champ Favicon pour mettre à jour l'icône visible près de l'URL.",
  },
  {
    question: "Où trouver les offres ComptaMatch ?",
    answer:
      "La page \"Comparer les offres\" détaille toutes les formules disponibles ainsi que les logiciels proposés.",
  },
];

const FaqPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-black">FAQ</h1>
        <p className="text-sm text-slate-600">
          Questions fréquentes sur la personnalisation et l'utilisation de ComptaMatch.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((item) => (
          <div key={item.question} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-black">{item.question}</h2>
            <p className="text-sm text-slate-700 mt-1">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaqPage;
