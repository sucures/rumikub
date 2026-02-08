import React from 'react';
import { Link } from 'react-router-dom';

export default function PlaceholderPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-4">Placeholder</h1>
      <p className="text-gray-400 mb-6">This route is not yet implemented.</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors duration-200"
      >
        <span aria-hidden>←</span> Back to Home
      </Link>
    </main>
  );
}
