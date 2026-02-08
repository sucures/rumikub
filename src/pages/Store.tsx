import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '../store/userStore';
import { useWalletStore } from '../store/walletStore';
import { listStoreItems } from '../api/store';
import type { StoreItem } from '../api/store';
import Button from '../components/ui/Button';

const TYPE_LABELS: Record<string, string> = {
  coins_pack: 'Coin Packs',
  gems_pack: 'Gem Packs',
  skin: 'Skins',
  ticket: 'Tickets',
};

export default function StorePage() {
  const { token } = useUserStore();
  const { coins, gems, purchaseItem, fetchWallet } = useWalletStore();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['store'],
    queryFn: listStoreItems,
    enabled: !!token,
  });

  useEffect(() => {
    if (token) fetchWallet();
  }, [token, fetchWallet]);

  const handlePurchase = async (item: StoreItem) => {
    setError(null);
    setPurchasingId(item.id);
    const result = await purchaseItem(item.id);
    setPurchasingId(null);
    if (!result.success) setError(result.error ?? 'Failed to purchase');
  };

  const getPriceLabel = (item: StoreItem) => {
    if (item.priceCoins && item.priceCoins > 0) return `${item.priceCoins} coins`;
    if (item.priceGems && item.priceGems > 0) return `${item.priceGems} gems`;
    return 'Free';
  };

  const canAfford = (item: StoreItem) => {
    if (item.priceCoins && item.priceCoins > 0) return coins >= item.priceCoins;
    if (item.priceGems && item.priceGems > 0) return gems >= item.priceGems;
    return true;
  };

  const grouped = items.reduce<Record<string, StoreItem[]>>((acc, item) => {
    const key = item.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (!token) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link to="/" className="text-gray-400 hover:text-white">← Home</Link>
        <div className="card p-8 mt-8 text-center">
          <p className="text-gray-400">Log in to view the store.</p>
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

      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 tracking-tight">
            Store
          </h1>
          <p className="text-sm text-gray-400">
            Coins: {coins} · Gems: {gems}
          </p>
        </div>
        <Link
          to="/wallet"
          className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700 transition-all"
        >
          Wallet
        </Link>
      </div>

      {error && (
        <div className="card p-4 mb-6 border-red-500/50 bg-red-900/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="card p-8 text-center text-gray-400 animate-pulse-subtle">Loading...</div>
      ) : items.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">No items available.</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([type, typeItems]) => (
            <section key={type}>
              <h2 className="text-lg font-semibold text-white mb-4">{TYPE_LABELS[type] ?? type}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {typeItems.map((item) => (
                  <div
                    key={item.id}
                    className="card p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-medium text-white">{item.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{getPriceLabel(item)}</p>
                    </div>
                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={!canAfford(item) || purchasingId === item.id}
                      fullWidth
                    >
                      {purchasingId === item.id ? 'Purchasing...' : 'Buy'}
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
