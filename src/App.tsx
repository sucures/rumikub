import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import HomePage from './pages/HomePage';
import NotificationsPage from './pages/NotificationsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import MotivationSettings from './pages/MotivationSettings';
import RumiWallet from './pages/RumiWallet';
import IdentityPage from './pages/identity';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <Header />
      <div className="flex-1 transition-opacity duration-200">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/motivation" element={<MotivationSettings />} />
          <Route path="/rumi-wallet" element={<RumiWallet />} />
          <Route path="/identity" element={<IdentityPage />} />
          <Route path="/placeholder" element={<PlaceholderPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
