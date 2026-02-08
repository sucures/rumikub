import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { useWalletStore } from '../store/walletStore';
import type { Transaction } from '../store/walletStore';

function formatDate(s: string) {
  try {
    const d = new Date(s);
    return d.toLocaleString();
  } catch {
    return s;
  }
}

export default function WalletPage() {
  const { token } = useUserStore();
  const { coins, gems, transactions, isLoading, error, fetchWallet } = useWalletStore();

  useEffect(() => {
    if (token) fetchWallet();
  }, [token, fetchWallet]);

  if (!token) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link to="/" className="text-gray-400 hover:text-white">← Home</Link>
        <div className="card p-8 mt-8 text-center">
          <p className="text-gray-400">Log in to view your wallet.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Home
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
        Wallet
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        RumiCoins and RumiGems. Use coins for games and skins; gems for premium items.
      </p>

      {error && (
        <div className="card p-4 mb-6 border-red-500/50 bg-red-900/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="card p-8 text-center text-gray-400 animate-pulse-subtle">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl" aria-hidden>🟡</span>
                <span className="text-sm text-gray-400">Coins</span>
              </div>
              <span className="text-2xl font-bold text-amber-400">{coins}</span>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl" aria-hidden>💎</span>
                <span className="text-sm text-gray-400">Gems</span>
              </div>
              <span className="text-2xl font-bold text-cyan-400">{gems}</span>
            </div>
          </div>

          <Link
            to="/store"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-500 mb-8 transition-all"
          >
            Go to Store
          </Link>

          <h2 className="text-lg font-semibold text-white mb-4">Transaction history</h2>
          {transactions.length === 0 ? (
            <div className="card p-6 text-center text-gray-400">No transactions yet.</div>
          ) : (
            <div className="card divide-y divide-gray-700/50">
              {transactions.map((tx: Transaction) => (
                <div key={tx.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-300">{tx.description || tx.type}</p>
                    <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                  </div>
                  <span
                    className={`font-medium tabular-nums ${
                      tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.currency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
