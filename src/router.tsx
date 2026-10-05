import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import StudioPage from './pages/StudioPage';
import VodPage from './pages/VodPage';
import LiveSportsPage from './pages/LiveSportsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import VerifyCardPage from './pages/VerifyCardPage';

/**
 * Configuration globale du routeur PANU (Français exclusif)
 * Relié à Supabase (https://xscnbjmiinznzepxzcvn.supabase.co)
 * Inclut la route publique /verify/:cardNumber qui interroge verify_member_card
 */
export const PanuAppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/vod" element={<VodPage />} />
        <Route path="/live" element={<LiveSportsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify/:cardNumber" element={<VerifyCardPage />} />
        <Route path="/verify" element={<Navigate to="/verify/PANU-FND-001" replace />} />
        {/* Redirection automatique des routes inconnues vers l'accueil */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default PanuAppRouter;
