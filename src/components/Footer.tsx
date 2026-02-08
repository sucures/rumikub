import React from 'react';
import { Link } from 'react-router-dom';
import { RUMI_ONE_EMBLEM_PATH } from '../../shared/branding';

export function Footer() {
  return (
    <footer className="border-t border-gray-700/80 bg-gray-900/50 mt-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/identity"
          className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors duration-200"
        >
          <img src={RUMI_ONE_EMBLEM_PATH} alt="RUMI ONE Sovereign Seal" className="h-6 w-6 object-contain" />
          <span>RUMI ONE Identity</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-300 transition-colors">Home</Link>
          <Link to="/rumi-wallet" className="hover:text-gray-300 transition-colors">Rumi Wallet</Link>
          <Link to="/identity" className="hover:text-gray-300 transition-colors">Identity</Link>
        </nav>
      </div>
    </footer>
  );
}
