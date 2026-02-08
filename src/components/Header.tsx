import React from 'react';
import { Link } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { useUserStore } from '../store/userStore';
import { RUMI_ONE_EMBLEM_PATH } from '../../shared/branding';

export function Header() {
  const premium = useUserStore((s) => s.premium);
  const token = useUserStore((s) => s.token);

  return (
    <header className="sticky top-0 z-10 border-b border-gray-700/80 bg-gray-900/70 backdrop-blur-md supports-[backdrop-filter]:bg-gray-900/90 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold text-amber-400 hover:text-amber-300 transition-colors duration-200 shrink-0 focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-lg"
        >
          <img src={RUMI_ONE_EMBLEM_PATH} alt="RUMI ONE Sovereign Seal" className="h-8 w-8 object-contain" />
          Rummikub
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link
            to="/"
            className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
          >
            Home
          </Link>
          <Link
            to="/notifications"
            className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
          >
            Notifications
          </Link>
          <Link
            to="/rumi-wallet"
            className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
          >
            Rumi Wallet
          </Link>
          <Link
            to="/identity"
            className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
          >
            Identity
          </Link>
          <Link
            to="/placeholder"
            className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
          >
            Placeholder
          </Link>
          {token && premium && (
            <Link
              to="/motivation"
              className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              Motivation
            </Link>
          )}
          <NotificationBell />
        </nav>
      </div>
    </header>
  );
}
