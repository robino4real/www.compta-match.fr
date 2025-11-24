import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import HomePage from "./pages/HomePage";
import OffersPage from "./pages/OffersPage";
import PricingPage from "./pages/PricingPage";
import DownloadsPage from "./pages/DownloadsPage";
import CartPage from "./pages/CartPage";
import ContactPage from "./pages/ContactPage";

import CgvPage from "./pages/CgvPage";
import MentionsLegalesPage from "./pages/MentionsLegalesPage";
import ConfidentialitePage from "./pages/ConfidentialitePage";

import NotFoundPage from "./pages/NotFoundPage";
import AuthLoginPage from "./pages/AuthLoginPage";
import AuthRegisterPage from "./pages/AuthRegisterPage";
import AccountPage from "./pages/AccountPage";
import { useAuth } from "./context/AuthContext";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-10 text-xs text-slate-600">
        Vérification de votre session en cours...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/offres" element={<OffersPage />} />
        <Route path="/tarifs" element={<PricingPage />} />
        <Route path="/telechargements" element={<DownloadsPage />} />
        <Route path="/panier" element={<CartPage />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/cgv" element={<CgvPage />} />
        <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="/confidentialite" element={<ConfidentialitePage />} />

        <Route path="/auth/login" element={<AuthLoginPage />} />
        <Route path="/auth/register" element={<AuthRegisterPage />} />
        <Route
          path="/mon-compte"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
};

export default App;
