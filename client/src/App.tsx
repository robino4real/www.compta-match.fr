import React from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import WebAppLayout from "./layouts/WebAppLayout";

import HomePage from "./pages/HomePage";
import { useAdminAuth } from "./context/AdminAuthContext";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminDownloadsPage from "./pages/admin/AdminDownloadsPage";
import AdminDownloadEditPage from "./pages/admin/AdminDownloadEditPage";
import AdminStripeSettingsPage from "./pages/admin/AdminStripeSettingsPage";
import AdminPromoCodesPage from "./pages/admin/AdminPromoCodesPage";
import AdminCompanySettingsPage from "./pages/admin/AdminCompanySettingsPage";
import AdminInvoiceDetailPage from "./pages/admin/AdminInvoiceDetailPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminOrderDetailPage from "./pages/admin/AdminOrderDetailPage";
import AdminClientsPage from "./pages/admin/AdminClientsPage";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage";
import AdminCustomerPortfolioPage from "./pages/admin/AdminCustomerPortfolioPage";
import AdminCustomerDetailPage from "./pages/admin/AdminCustomerDetailPage";
import AdminClientDetailPage from "./pages/admin/AdminClientDetailPage";
import AdminEmailsPage from "./pages/admin/AdminEmailsPage";
import AdminLegalPagesPage from "./pages/admin/AdminLegalPagesPage";
import AdminLegalPageEditPage from "./pages/admin/AdminLegalPageEditPage";
import AdminArticlesPage from "./pages/admin/AdminArticlesPage";
import AdminArticleEditPage from "./pages/admin/AdminArticleEditPage";
import AdminHomepagePage from "./pages/admin/AdminHomepagePage";
import AdminSeoPage from "./pages/admin/AdminSeoPage";
import AdminPagesPage from "./pages/admin/AdminPagesPage";
import AdminPageDetailPage from "./pages/admin/AdminPageDetailPage";
import AdminNewsletterPage from "./pages/admin/AdminNewsletterPage";
import AdminSuretyBackupsPage from "./pages/admin/AdminSuretyBackupsPage";
import AnalyticsTracker from "./components/AnalyticsTracker";
import DownloadableProductsPage from "./pages/DownloadableProductsPage";
import ComptaProSubscriptionPage from "./pages/ComptaProSubscriptionPage";
import ComptaProPlanDetailPage from "./pages/ComptaProPlanDetailPage";
import ComptAssoSubscriptionPage from "./pages/ComptAssoSubscriptionPage";
import ComptAssoLanding from "./pages/ComptAssoPlanDetailPage";
import CompareOffersPage from "./pages/CompareOffersPage";
import DiscoveryPage from "./pages/DiscoveryPage";
import FaqPage from "./pages/FaqPage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import AdminPaidServicesPage from "./pages/admin/AdminPaidServicesPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { WebAppProvider, WebAppRouteType } from "./context/WebAppContext";
import MonProfilPage from "./pages/account/MonProfilPage";
import AccountSubscriptionsPage from "./pages/account/AccountSubscriptionsPage";
import AccountOrdersPage from "./pages/account/AccountOrdersPage";
import AccountOrderDetailPage from "./pages/account/AccountOrderDetailPage";
import AccountSettingsPage from "./pages/account/AccountSettingsPage";
import AccountProfilePage from "./pages/account/AccountProfilePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import LegalPage from "./pages/LegalPage";
import AuthLoginPage from "./pages/AuthLoginPage";
import AuthRegisterPage from "./pages/AuthRegisterPage";
import ProSpacePage from "./pages/ProSpacePage";
import AssoSpacePage from "./pages/AssoSpacePage";
import PageBuilderPage from "./pages/PageBuilderPage";
import WebAppSubscriptionsPage from "./pages/app/WebAppSubscriptionsPage";
import WebAppSettingsPage from "./pages/app/WebAppSettingsPage";
import WebAppHomePage from "./pages/app/WebAppHomePage";
import WebAppAccountingPage from "./pages/app/WebAppAccountingPage";
import WebAppDocumentsPage from "./pages/app/WebAppDocumentsPage";
import AdminClientQuestionsPage from "./pages/admin/AdminClientQuestionsPage";
import AdminClientQuestionDetailPage from "./pages/admin/AdminClientQuestionDetailPage";

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-10 text-xs text-slate-600">
        Vérification de votre session en cours...
      </div>
    );
  }

  if (!admin) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location, adminAccess: true }}
        replace
      />
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const NotFoundRedirect = <Navigate to="/" replace />;

  const MainLayoutWrapper: React.FC = () => (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );

  const AdminLayoutWrapper: React.FC = () => (
    <RequireAdmin>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </RequireAdmin>
  );

  const WebAppLayoutWrapper: React.FC<{ routeType: WebAppRouteType }> = ({ routeType }) => (
    <WebAppProvider initialType={routeType}>
      <WebAppLayout>
        <Outlet />
      </WebAppLayout>
    </WebAppProvider>
  );

  return (
    <>
      <AnalyticsTracker />
      <Routes>
        <Route element={<MainLayoutWrapper />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/comparatif-des-offres"
            element={<PageBuilderPage route="/comparatif-des-offres" fallback={<CompareOffersPage />} />}
          />
          <Route path="/offres" element={<Navigate to="/comparatif-des-offres" replace />} />
          <Route
            path="/logiciels"
            element={<PageBuilderPage route="/logiciels" fallback={<DownloadableProductsPage />} />}
          />
          <Route
            path="/comptapro"
            element={<PageBuilderPage route="/comptapro" fallback={<ComptaProSubscriptionPage />} />}
          />
          <Route path="/comptapro/:planSlug" element={<ComptaProPlanDetailPage />} />
          <Route
            path="/comptasso"
            element={<PageBuilderPage route="/comptasso" fallback={<ComptAssoSubscriptionPage />} />}
          />
          <Route path="/comptasso/:planSlug" element={<ComptAssoLanding />} />
          {["/articles", "/faq", "/cgv", "/mentions-legales", "/confidentialite", "/cookies"].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <PageBuilderPage
                  route={path}
                  fallback={
                    path === "/faq" || path === "/articles" ? (
                      <FaqPage />
                    ) : (
                      <LegalPage slugOverride={path.replace("/", "")} />
                    )
                  }
                />
              }
            />
          ))}
          <Route path="/articles/:slug" element={<ArticleDetailPage />} />
          <Route path="/découverte" element={<DiscoveryPage />} />
          <Route path="/decouverte" element={<Navigate to="/découverte" replace />} />
          <Route path="/panier" element={<CartPage />} />
          <Route path="/commande" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<PaymentSuccessPage />} />
          <Route
            path="/paiement/success"
            element={<Navigate to="/checkout/success" replace />}
          />
          <Route path="/paiement/cancel" element={<PaymentCancelPage />} />
          <Route path="/auth/login" element={<AuthLoginPage />} />
          <Route path="/auth/register" element={<AuthRegisterPage />} />
          <Route path="/:legalSlug" element={<LegalPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/compte" element={<MonProfilPage />} />
            <Route path="/compte/abonnements" element={<AccountSubscriptionsPage />} />
            <Route path="/compte/commandes" element={<AccountOrdersPage />} />
            <Route path="/compte/commandes/:orderId" element={<AccountOrderDetailPage />} />
            <Route path="/compte/parametres" element={<AccountSettingsPage />} />
            <Route path="/compte/informations" element={<AccountProfilePage />} />
          </Route>
          <Route path="*" element={NotFoundRedirect} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route
            path="/app/comptapro/:ficheId/*"
            element={<WebAppLayoutWrapper routeType="comptapro" />}
          >
            <Route index element={<WebAppHomePage expectedType="COMPTAPRO" routeType="comptapro" />} />
            <Route
              path="comptabilite"
              element={<WebAppAccountingPage expectedType="COMPTAPRO" routeType="comptapro" />}
            />
            <Route
              path="documents"
              element={<WebAppDocumentsPage expectedType="COMPTAPRO" routeType="comptapro" />}
            />
            <Route
              path="abonnements"
              element={<WebAppSubscriptionsPage expectedType="COMPTAPRO" routeType="comptapro" />}
            />
            <Route
              path="parametres"
              element={<WebAppSettingsPage expectedType="COMPTAPRO" routeType="comptapro" />}
            />
          </Route>
          <Route
            path="/app/comptasso/:ficheId/*"
            element={<WebAppLayoutWrapper routeType="comptasso" />}
          >
            <Route index element={<WebAppHomePage expectedType="COMPTASSO" routeType="comptasso" />} />
            <Route
              path="comptabilite"
              element={<WebAppAccountingPage expectedType="COMPTASSO" routeType="comptasso" />}
            />
            <Route
              path="documents"
              element={<WebAppDocumentsPage expectedType="COMPTASSO" routeType="comptasso" />}
            />
            <Route
              path="abonnements"
              element={<WebAppSubscriptionsPage expectedType="COMPTASSO" routeType="comptasso" />}
            />
            <Route
              path="parametres"
              element={<WebAppSettingsPage expectedType="COMPTASSO" routeType="comptasso" />}
            />
          </Route>
        </Route>

        <Route path="/mon-espace-pro" element={<ProSpacePage />} />
        <Route path="/mon-espace-asso" element={<AssoSpacePage />} />

        <Route path="/admin" element={<AdminLayoutWrapper />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="telechargements" element={<AdminDownloadsPage />} />
          <Route path="telechargements/:id" element={<AdminDownloadEditPage />} />
          <Route path="clients" element={<AdminClientsPage />} />
          <Route path="clients/:clientId" element={<AdminClientDetailPage />} />
          <Route path="customers" element={<AdminCustomerPortfolioPage />} />
          <Route path="customers/:customerId" element={<AdminCustomerDetailPage />} />
          <Route path="portfolio" element={<AdminCustomerPortfolioPage />} />
          <Route path="portfolio/:customerId" element={<AdminCustomerDetailPage />} />
          <Route path="promo-codes" element={<AdminPromoCodesPage />} />
          <Route path="stripe-settings" element={<AdminStripeSettingsPage />} />
          <Route path="company-settings" element={<AdminCompanySettingsPage />} />
          <Route path="emails" element={<AdminEmailsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="orders/:orderId/invoice" element={<AdminInvoiceDetailPage />} />
          <Route path="invoices/*" element={<Navigate to="/admin/orders" replace />} />
          <Route path="legal-pages" element={<AdminLegalPagesPage />} />
          <Route path="legal-pages/:id" element={<AdminLegalPageEditPage />} />
          <Route path="articles" element={<AdminArticlesPage />} />
          <Route path="articles/new" element={<AdminArticleEditPage />} />
          <Route path="articles/:id" element={<AdminArticleEditPage />} />
          <Route path="newsletter" element={<AdminNewsletterPage />} />
          <Route path="client-questions" element={<AdminClientQuestionsPage />} />
          <Route path="client-questions/:id" element={<AdminClientQuestionDetailPage />} />
          <Route path="pages" element={<AdminPagesPage />} />
          <Route path="pages/:id" element={<AdminPageDetailPage />} />
          <Route path="homepage" element={<AdminHomepagePage />} />
          <Route path="seo" element={<AdminSeoPage />} />
          <Route path="sauvegardes-surete" element={<AdminSuretyBackupsPage />} />
          <Route path="paid-services" element={<AdminPaidServicesPage />} />
          <Route path="paid-services-comptasso" element={<AdminPaidServicesPage serviceType="COMPTASSO" />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
