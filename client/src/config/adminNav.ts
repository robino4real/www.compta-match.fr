export type AdminNavItem = {
  label: string;
  href: string;
};

export type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "Vue d'ensemble",
    items: [{ label: "Dashboard", href: "/admin" }],
  },
  {
    title: "Boutique",
    items: [
      { label: "Produits téléchargeables", href: "/admin/telechargements" },
      { label: "Codes promo", href: "/admin/promo-codes" },
      { label: "Commandes", href: "/admin/orders" },
      { label: "Services payants", href: "/admin/paid-services" },
      { label: "Services ComptAsso", href: "/admin/paid-services-comptasso" },
    ],
  },
  {
    title: "Clients",
    items: [
      { label: "Clients", href: "/admin/clients" },
      { label: "Questions client", href: "/admin/client-questions" },
    ],
  },
  {
    title: "Contenus",
    items: [
      { label: "Articles / blog", href: "/admin/articles" },
      { label: "Page d'accueil", href: "/admin/homepage" },
      { label: "Pages", href: "/admin/pages" },
      { label: "Pages légales", href: "/admin/legal-pages" },
    ],
  },
  {
    title: "Paramètres",
    items: [
      { label: "Paramètres entreprise", href: "/admin/company-settings" },
      { label: "Paramètres e-mails", href: "/admin/emails" },
      { label: "SEO / GEO", href: "/admin/seo" },
    ],
  },
];
