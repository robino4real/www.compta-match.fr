import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

import HomePage from './pages/HomePage';
import OffersPage from './pages/OffersPage';
import PricingPage from './pages/PricingPage';
import DownloadsPage from './pages/DownloadsPage';
import CartPage from './pages/CartPage';
import ContactPage from './pages/ContactPage';

import CgvPage from './pages/CgvPage';
import MentionsLegalesPage from './pages/MentionsLegalesPage';
import ConfidentialitePage from './pages/ConfidentialitePage';

import NotFoundPage from './pages/NotFoundPage';
import AuthLoginPage from './pages/AuthLoginPage';
import AuthRegisterPage from './pages/AuthRegisterPage';

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
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
};

export default App;
