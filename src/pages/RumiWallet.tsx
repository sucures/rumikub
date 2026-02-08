import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/userStore';
import {
  getRumiWalletBalance,
  getRumiWalletTransactions,
  transferRumiTokens,
  mapWalletErrorMessage,
  type RumiWalletTransaction,
} from '../api/rumiWallet';
import { getPublicProfile } from '../api/profile';
import Button from '../components/ui/Button';
import { RUMI_ONE_EMBLEM_PATH } from '../../shared/branding';

export default function RumiWalletPage() {
  const { token } = useUserStore();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<RumiWalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toUsername, setToUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const fetchWallet = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [bal, txs] = await Promise.all([
        getRumiWalletBalance(),
        getRumiWalletTransactions(50, 0),
      ]);
      setBalance(bal);
      setTransactions(txs);
    } catch (err) {
      const message = mapWalletErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [token]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    setTransferSuccess(false);
    const trimmed = toUsername.trim();
    const amt = Number(amount);
    if (!trimmed) {
      setTransferError('Username is required');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setTransferError('Amount must be a positive number');
      return;
    }
    setTransferLoading(true);
    try {
      const profile = await getPublicProfile(trimmed);
      if (!profile) {
        setTransferError('User not found');
        toast.error('User not found');
        setTransferLoading(false);
        return;
      }
      const result = await transferRumiTokens(profile.id, amt);
      setBalance(result.balance);
      setToUsername('');
      setAmount('');
      setTransferSuccess(true);
      toast.success('Transfer completed successfully.');
      await fetchWallet();
    } catch (err) {
      const message = mapWalletErrorMessage(err);
      setTransferError(message);
      toast.error(message);
    } finally {
      setTransferLoading(false);
    }
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString();
    } catch {
      return s;
    }
  };

  const getTxLabel = (tx: RumiWalletTransaction) => {
    const meta = tx.metadata ?? {};
    if (tx.type === 'spend' && meta.merchantName) return String(meta.merchantName);
    if (tx.type === 'transfer_in' && meta.fromUserId) return 'From user';
    if (tx.type === 'transfer_out' && meta.toUserId) return 'To user';
    return tx.type;
  };

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link to="/" className="text-sm text-amber-400 hover:text-amber-300 mb-6 inline-block">
        ← Back
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <img src={RUMI_ONE_EMBLEM_PATH} alt="RUMI ONE Sovereign Seal" className="h-10 w-10 object-contain" />
        <div>
          <h1 className="text-2xl font-bold text-white">Rumi Wallet</h1>
          <p className="text-gray-400 text-sm">
            Your Rumi token balance for payments and transfers.
          </p>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="text-sm text-gray-400">Balance</div>
        <div className="text-3xl font-bold text-amber-400 mt-1">{balance} tokens</div>
      </div>

      <div className="card p-4 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Transfer tokens</h2>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label htmlFor="toUsername" className="block text-sm text-gray-400 mb-2">
              Recipient username
            </label>
            <input
              id="toUsername"
              type="text"
              value={toUsername}
              onChange={(e) => setToUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm text-gray-400 mb-2">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50"
              className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          {transferError && <p className="text-red-400 text-sm">{transferError}</p>}
          {transferSuccess && <p className="text-green-400 text-sm">Transfer successful!</p>}
          <Button type="submit" disabled={transferLoading}>
            {transferLoading ? 'Transferring...' : 'Transfer'}
          </Button>
        </form>
      </div>

      <div className="card p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Transaction history</h2>
        {isLoading ? (
          <p className="text-gray-400">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-500">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center py-3 border-b border-gray-700/50 last:border-0"
              >
                <div>
                  <div className="font-medium text-white">{getTxLabel(tx)}</div>
                  <div className="text-xs text-gray-500">{formatDate(tx.createdAt)}</div>
                </div>
                <div
                  className={`font-semibold ${
                    tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {tx.amount > 0 ? '+' : ''}
                  {tx.amount} tokens
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
