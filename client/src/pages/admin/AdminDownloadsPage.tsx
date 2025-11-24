import React from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

const AdminDownloadsPage: React.FC = () => {
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [priceEuros, setPriceEuros] = React.useState("");
  const [shortDescription, setShortDescription] = React.useState("");
  const [longDescription, setLongDescription] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Le nom du logiciel est requis.");
      return;
    }

    if (!priceEuros.trim()) {
      setError("Le prix est requis.");
      return;
    }

    if (!file) {
      setError("Veuillez sélectionner un fichier à téléverser.");
      return;
    }

    const normalizedPrice = priceEuros.replace(",", ".");
    const priceNumber = Number(normalizedPrice);

    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      setError("Le prix doit être un nombre positif.");
      return;
    }

    const priceCents = Math.round(priceNumber * 100);

    const formData = new FormData();
    formData.append("name", name.trim());
    if (slug.trim()) {
      formData.append("slug", slug.trim());
    }
    formData.append("priceCents", String(priceCents));
    if (shortDescription.trim()) {
      formData.append("shortDescription", shortDescription.trim());
    }
    if (longDescription.trim()) {
      formData.append("longDescription", longDescription.trim());
    }
    if (file) {
      formData.append("file", file);
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/admin/downloads`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSuccess("Produit créé et fichier téléversé avec succès.");
        setName("");
        setSlug("");
        setPriceEuros("");
        setShortDescription("");
        setLongDescription("");
        setFile(null);
        event.currentTarget.reset();
      } else {
        setError(
          (data as { message?: string }).message ||
            "Impossible de créer ce produit téléchargeable."
        );
      }
    } catch (err) {
      console.error("Erreur lors de la création du produit téléchargeable", err);
      setError(
        "Une erreur est survenue lors de la création du produit. Merci de réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <h1 className="text-xl font-semibold text-black">
          Gestion des logiciels téléchargeables
        </h1>
        <p className="text-xs text-slate-600">
          Depuis cet espace, vous pouvez ajouter un nouveau logiciel à la vitrine
          en important le fichier exécutable ou l&apos;archive depuis votre ordinateur.
          Les produits créés ici pourront ensuite être proposés à la vente sur le site.
        </p>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-black">
          Ajouter un nouveau produit téléchargeable
        </h2>

        {error && <p className="text-[11px] text-red-600">{error}</p>}
        {success && <p className="text-[11px] text-emerald-600">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom + Slug */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-800">
                Nom du logiciel *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="ComptaMini - Edition comptabilité générale"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-800">
                Slug (optionnel)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="comptamini-compta-generale"
              />
              <p className="text-[11px] text-slate-500">
                Si laissé vide, un identifiant sera généré automatiquement à partir du
                nom.
              </p>
            </div>
          </div>

          {/* Prix */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-800">
              Prix TTC (en euros) *
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={priceEuros}
              onChange={(e) => setPriceEuros(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="49,90"
              required
            />
            <p className="text-[11px] text-slate-500">
              Le montant sera automatiquement converti en centimes côté serveur.
            </p>
          </div>

          {/* Descriptions */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-800">
              Courte description
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Résumé rapide affiché dans la vitrine."
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-800">
              Description détaillée
            </label>
            <textarea
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black min-h-[100px]"
              placeholder="Description complète du logiciel, fonctionnalités, prérequis, etc."
            />
          </div>

          {/* Fichier */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-800">
              Fichier du logiciel (EXE, DMG, ZIP) *
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white hover:file:text-black hover:file:border hover:file:border-black"
              required
            />
            <p className="text-[11px] text-slate-500">
              Le fichier sera stocké sur le serveur. Assurez-vous d&apos;uploader la version
              correcte du logiciel (Windows, macOS, etc.).
            </p>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-white hover:text-black hover:border hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Création en cours..." : "Créer le produit"}
          </button>
        </form>

        <p className="text-[11px] text-slate-500">
          Remarque : pour les tests de développement, le fichier est stocké sur le
          serveur dans un dossier interne. Plus tard, une logique de droits d&apos;accès et
          de lien de téléchargement client sera mise en place.
        </p>
      </section>
    </div>
  );
};

export default AdminDownloadsPage;
