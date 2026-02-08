import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  listMarketplaceItems,
  getInventory,
} from '../api/marketplace';
import type { CosmeticItem } from '../api/marketplace';
import { useUserStore } from '../store/userStore';
import Button from '../components/ui/Button';

const rarityColors: Record<string, string> = {
  common: 'text-gray-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
};

function ItemCard({
  item,
  owned,
}: {
  item: CosmeticItem;
  owned: boolean;
}) {
  const price =
    item.priceCoins > 0
      ? `${item.priceCoins} 🟡`
      : item.priceGems > 0
      ? `${item.priceGems} 💎`
      : 'Free';

  return (
    <Link
      to={`/marketplace/${item.id}`}
      className="card p-4 block hover:bg-gray-700/30 transition-colors"
    >
      <div
        className="w-full h-20 rounded-lg bg-gray-700/50 mb-3 flex items-center justify-center text-2xl"
        style={{
          backgroundColor: (item.metadata?.color as string) ?? undefined,
        }}
      >
        {item.type === 'skin' && '🎨'}
        {item.type === 'board' && '🃏'}
        {item.type === 'tiles' && '🀄'}
        {item.type === 'effect' && '✨'}
      </div>
      <h3 className="font-medium text-white truncate">{item.name}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs font-medium ${rarityColors[item.rarity] ?? 'text-gray-400'}`}>
          {item.rarity}
        </span>
        {owned ? (
          <span className="text-xs text-green-400">Owned</span>
        ) : (
          <span className="text-xs text-amber-400">{price}</span>
        )}
      </div>
    </Link>
  );
}

export default function MarketplacePage() {
  const { token } = useUserStore();
  const [activeTab, setActiveTab] = useState<'all' | 'skins' | 'boards' | 'tiles' | 'effects' | 'limited'>(
    'all'
  );

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['marketplace', activeTab],
    queryFn: () =>
      listMarketplaceItems(
        activeTab === 'all'
          ? {}
          : activeTab === 'limited'
          ? { featured: true }
          : { type: activeTab as CosmeticItem['type'] }
      ),
    enabled: true,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
    enabled: !!token,
  });

  const ownedIds = new Set(inventory.map((i) => i.itemId));

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Home
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 tracking-tight">
            Marketplace
          </h1>
          <p className="text-sm text-gray-400">
            Skins, boards, tiles, and effects. Customize your game.
          </p>
        </div>
        {token && (
          <Link
            to="/inventory"
            className="px-4 py-2 rounded-lg bg-gray-700/60 text-gray-300 hover:text-white hover:bg-gray-600/60 text-sm font-medium"
          >
            My Inventory
          </Link>
        )}
      </div>

      {token && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'skins', 'boards', 'tiles', 'effects', 'limited'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'limited' ? 'Limited' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="card p-8 text-center text-gray-400 animate-pulse-subtle">Loading...</div>
      ) : items.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">
          No items available yet. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} owned={ownedIds.has(item.id)} />
          ))}
        </div>
      )}
    </main>
  );
}
