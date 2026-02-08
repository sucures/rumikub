import React from 'react';
import { Link } from 'react-router-dom';
import { RUMI_ONE_EMBLEM_PATH } from '../../shared/branding';

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12 sm:py-20">
      <div className="max-w-lg mx-auto text-center animate-fade-in-up">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 mb-6"
          aria-hidden
        >
          <img src={RUMI_ONE_EMBLEM_PATH} alt="RUMI ONE Sovereign Seal" className="h-12 w-12 object-contain" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Welcome to Rummikub
        </h1>
        <p className="text-gray-400 mb-10 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
          Play with friends. Create rooms, join games, and be the first to empty your rack.
        </p>
        <Link
          to="/notifications"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-500 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-amber-900/20 hover:shadow-amber-800/30"
        >
          <span aria-hidden>🔔</span>
          View Notifications
        </Link>
      </div>
    </main>
  );
}
