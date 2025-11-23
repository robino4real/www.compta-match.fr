import React, { useMemo, useState } from 'react';

type AdminProduct = { id: string; name: string; price: number; active: boolean };
type AdminArticle = { id: string; title: string; content: string; published: boolean };
type AdminDiscount = { id: string; code: string; description?: string; percentage?: number; active: boolean };

const AdminPage = () => {
  const [products, setProducts] = useState<AdminProduct[]>([
    { id: 'p1', name: 'ComptaMini Découverte (gratuit)', price: 0, active: true },
    { id: 'p2', name: 'ComptaMini - Edition simplifiée', price: 0, active: true },
    { id: 'p3', name: 'Pack TVA & déclaration', price: 49, active: true }
  ]);
  const [productForm, setProductForm] = useState<AdminProduct>({ id: '', name: '', price: 0, active: true });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [articles, setArticles] = useState<AdminArticle[]>([
    { id: 'a1', title: 'Guide de démarrage TPE', content: 'Pas à pas pour connecter vos comptes et saisir vos écritures.', published: true },
    { id: 'a2', title: 'Checklist clôture annuelle', content: 'Points de contrôle avant édition du bilan.', published: true }
  ]);
  const [articleForm, setArticleForm] = useState<AdminArticle>({ id: '', title: '', content: '', published: true });
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  const [discounts, setDiscounts] = useState<AdminDiscount[]>([
    { id: 'd1', code: 'DEMO100', description: 'Accès Pro gratuit', percentage: 100, active: true },
    { id: 'd2', code: 'ZEROEURO', description: 'Téléchargement gratuit', percentage: 100, active: true }
  ]);
  const [discountForm, setDiscountForm] = useState<AdminDiscount>({ id: '', code: '', description: '', percentage: 10, active: true });
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      activeProducts: products.filter((p) => p.active).length,
      freeProducts: products.filter((p) => p.price === 0).length,
      publishedArticles: articles.filter((a) => a.published).length
    }),
    [products, articles]
  );

  const resetProductForm = () => {
    setProductForm({ id: '', name: '', price: 0, active: true });
    setEditingProductId(null);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProductId) {
      setProducts((prev) => prev.map((p) => (p.id === editingProductId ? { ...productForm, id: editingProductId } : p)));
    } else {
      setProducts((prev) => [...prev, { ...productForm, id: `p-${Date.now()}` }]);
    }
    resetProductForm();
  };

  const handleProductEdit = (product: AdminProduct) => {
    setEditingProductId(product.id);
    setProductForm(product);
  };

  const handleProductDelete = (id: string) => setProducts((prev) => prev.filter((p) => p.id !== id));

  const resetArticleForm = () => {
    setArticleForm({ id: '', title: '', content: '', published: true });
    setEditingArticleId(null);
  };

  const handleArticleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArticleId) {
      setArticles((prev) => prev.map((a) => (a.id === editingArticleId ? { ...articleForm, id: editingArticleId } : a)));
    } else {
      setArticles((prev) => [...prev, { ...articleForm, id: `a-${Date.now()}` }]);
    }
    resetArticleForm();
  };

  const handleArticleEdit = (article: AdminArticle) => {
    setEditingArticleId(article.id);
    setArticleForm(article);
  };

  const handleArticleDelete = (id: string) => setArticles((prev) => prev.filter((a) => a.id !== id));

  const resetDiscountForm = () => {
    setDiscountForm({ id: '', code: '', description: '', percentage: 10, active: true });
    setEditingDiscountId(null);
  };

  const handleDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDiscountId) {
      setDiscounts((prev) => prev.map((d) => (d.id === editingDiscountId ? { ...discountForm, id: editingDiscountId } : d)));
    } else {
      setDiscounts((prev) => [...prev, { ...discountForm, id: `d-${Date.now()}` }]);
    }
    resetDiscountForm();
  };

  const handleDiscountEdit = (discount: AdminDiscount) => {
    setEditingDiscountId(discount.id);
    setDiscountForm(discount);
  };

  const handleDiscountDelete = (id: string) => setDiscounts((prev) => prev.filter((d) => d.id !== id));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Espace réservé aux administrateurs</p>
          <h1 className="text-2xl font-bold text-slate-900">Console d'administration</h1>
          <p className="text-sm text-slate-600 mt-1">Gérez produits, articles et codes promo en direct.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-primary text-white rounded-md">Exporter les rapports</button>
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-md text-sm">
            {stats.freeProducts} produit(s) gratuits
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-100">
          <p className="text-sm text-slate-500">Produits actifs</p>
          <p className="text-2xl font-bold">{stats.activeProducts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-100">
          <p className="text-sm text-slate-500">Articles publiés</p>
          <p className="text-2xl font-bold">{stats.publishedArticles}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-100">
          <p className="text-sm text-slate-500">Codes actifs</p>
          <p className="text-2xl font-bold">{discounts.filter((d) => d.active).length}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-500">Gestion des produits téléchargeables</p>
            <h2 className="text-xl font-semibold text-slate-900">Créer, modifier, archiver</h2>
          </div>
          <button onClick={resetProductForm} className="text-sm text-primary underline">
            Ajouter un nouveau produit
          </button>
        </div>
        <form onSubmit={handleProductSubmit} className="grid md:grid-cols-4 gap-3 mb-4">
          <input
            value={productForm.name}
            onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nom"
            className="border border-slate-200 rounded-md px-3 py-2"
            required
          />
          <input
            type="number"
            value={productForm.price}
            onChange={(e) => setProductForm((p) => ({ ...p, price: Number(e.target.value) }))}
            placeholder="Prix"
            className="border border-slate-200 rounded-md px-3 py-2"
            min={0}
            step={1}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={productForm.active}
              onChange={(e) => setProductForm((p) => ({ ...p, active: e.target.checked }))}
            />
            Actif
          </label>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md font-semibold">
            {editingProductId ? 'Mettre à jour' : 'Créer le produit'}
          </button>
        </form>
        <div className="grid md:grid-cols-2 gap-3">
          {products.map((product) => (
            <div key={product.id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{product.name}</p>
                <p className="text-sm text-slate-600">{product.price} € — {product.active ? 'Actif' : 'Archivé'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleProductEdit(product)} className="text-primary text-sm">
                  Modifier
                </button>
                <button onClick={() => handleProductDelete(product.id)} className="text-red-600 text-sm">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-100 grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Articles / fiches d'aide</h2>
            <button onClick={resetArticleForm} className="text-sm text-primary underline">
              Nouvel article
            </button>
          </div>
          <form onSubmit={handleArticleSubmit} className="space-y-3">
            <input
              value={articleForm.title}
              onChange={(e) => setArticleForm((a) => ({ ...a, title: e.target.value }))}
              placeholder="Titre"
              className="w-full border border-slate-200 rounded-md px-3 py-2"
              required
            />
            <textarea
              value={articleForm.content}
              onChange={(e) => setArticleForm((a) => ({ ...a, content: e.target.value }))}
              placeholder="Contenu"
              className="w-full border border-slate-200 rounded-md px-3 py-2 min-h-[120px]"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={articleForm.published}
                onChange={(e) => setArticleForm((a) => ({ ...a, published: e.target.checked }))}
              />
              Publier
            </label>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md font-semibold">
              {editingArticleId ? 'Mettre à jour' : 'Publier'}
            </button>
          </form>
        </div>
        <div className="space-y-3">
          {articles.map((article) => (
            <div key={article.id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{article.title}</p>
                  <p className="text-sm text-slate-600">{article.published ? 'Publié' : 'Brouillon'}</p>
                  <p className="text-sm text-slate-700 mt-1 line-clamp-2">{article.content}</p>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <button onClick={() => handleArticleEdit(article)} className="text-primary text-sm">
                    Modifier
                  </button>
                  <button onClick={() => handleArticleDelete(article.id)} className="text-red-600 text-sm">
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-500">Codes promo / remises</p>
            <h2 className="text-xl font-semibold text-slate-900">Créer et activer des réductions</h2>
          </div>
          <button onClick={resetDiscountForm} className="text-sm text-primary underline">
            Nouveau code
          </button>
        </div>
        <form onSubmit={handleDiscountSubmit} className="grid md:grid-cols-5 gap-3 mb-4">
          <input
            value={discountForm.code}
            onChange={(e) => setDiscountForm((d) => ({ ...d, code: e.target.value.toUpperCase() }))}
            placeholder="Code"
            className="border border-slate-200 rounded-md px-3 py-2"
            required
          />
          <input
            value={discountForm.description}
            onChange={(e) => setDiscountForm((d) => ({ ...d, description: e.target.value }))}
            placeholder="Description"
            className="border border-slate-200 rounded-md px-3 py-2"
          />
          <input
            type="number"
            value={discountForm.percentage}
            onChange={(e) => setDiscountForm((d) => ({ ...d, percentage: Number(e.target.value) }))}
            placeholder="%"
            className="border border-slate-200 rounded-md px-3 py-2"
            min={0}
            max={100}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={discountForm.active}
              onChange={(e) => setDiscountForm((d) => ({ ...d, active: e.target.checked }))}
            />
            Actif
          </label>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md font-semibold">
            {editingDiscountId ? 'Mettre à jour' : 'Créer le code'}
          </button>
        </form>
        <div className="space-y-3">
          {discounts.map((discount) => (
            <div key={discount.id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{discount.code}</p>
                <p className="text-sm text-slate-600">
                  {discount.percentage}% — {discount.description || 'Remise sans description'} — {discount.active ? 'Actif' : 'Inactif'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDiscountEdit(discount)} className="text-primary text-sm">
                  Modifier
                </button>
                <button onClick={() => handleDiscountDelete(discount.id)} className="text-red-600 text-sm">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
