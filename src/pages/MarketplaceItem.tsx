import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMarketplaceItem,
  purchaseMarketplaceItem,
  getInventory,
} from '../api/marketplace';
import type { CosmeticItem } from '../api/marketplace';
import { useUserStore } from '../store/userStore';
import { useWalletStore } from '../store/walletStore';
import Button from '../components/ui/Button';

const rarityColors: Record<string, string> = {
  common: 'text-gray-400 border-gray-500',
  rare: 'text-blue-400 border-blue-500',
  epic: 'text-purple-400 border-purple-500',
  legendary: 'text-amber-400 border-amber-500',
};

export default function MarketplaceItemPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const queryClient = useQueryClient();
  const { token } = useUserStore();
  const { fetchWallet } = useWalletStore();
  const [error, setError] = useState<string | null>(null);

  const { data: item, isLoading } = useQuery({
    queryKey: ['marketplace-item', itemId],
    queryFn: () => getMarketplaceItem(itemId!),
    enabled: !!itemId,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
    enabled: !!token,
  });

  const purchaseMutation = useMutation({
    mutationFn: () => purchaseMarketplaceItem(itemId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      fetchWallet();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    },
  });

  const owned = item && inventory.some((i) => i.itemId === item.id);

  if (!itemId) return <Navigate to="/marketplace" replace />;

  if (isLoading || !item) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="card p-8 text-center text-gray-400 animate-pulse-subtle">Loading...</div>
      </main>
    );
  }

  const price =
    item.priceCoins > 0 ? `${item.priceCoins} coins` : item.priceGems > 0 ? `${item.priceGems} gems` : 'Free';

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Marketplace
      </Link>

      <div className="card p-6">
        <div
          className="w-full h-40 rounded-xl mb-6 flex items-center justify-center text-5xl"
          style={{
            backgroundColor: (item.metadata?.color as string) ?? 'rgba(55, 65, 81, 0.5)',
          }}
        >
          {item.type === 'skin' && '🎨'}
          {item.type === 'board' && '🃏'}
          {item.type === 'tiles' && '🀄'}
          {item.type === 'effect' && '✨'}
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{item.name}</h1>
        <span
          className={`inline-block px-2 py-0.5 rounded text-sm font-medium border ${rarityColors[item.rarity] ?? 'text-gray-400'}`}
        >
          {item.rarity}
        </span>
        <p className="text-gray-400 mt-2">{item.type}</p>
        {item.isLimited && (
          <p className="text-amber-400 text-sm mt-2">Limited-time item</p>
        )}
        <p className="text-gray-300 mt-4">{price}</p>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-900/20 text-red-400 text-sm">{error}</div>
        )}

        <div className="mt-6 flex gap-3">
          {owned ? (
            <Link to="/inventory/loadout">
              <Button variant="secondary">Equip now</Button>
            </Link>
          ) : token ? (
            <Button
              onClick={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? 'Purchasing...' : 'Buy'}
            </Button>
          ) : (
            <Link to="/">
              <Button>Log in to purchase</Button>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
