import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getInventory } from '../api/marketplace';
import type { CosmeticItem, InventoryItem } from '../api/marketplace';
import { useUserStore } from '../store/userStore';
import { useLoadoutStore } from '../store/loadoutStore';
import Button from '../components/ui/Button';

const rarityColors: Record<string, string> = {
  common: 'text-gray-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
};

type Tab = 'skins' | 'boards' | 'tiles' | 'effects';

export default function InventoryPage() {
  const { token } = useUserStore();
  const { loadout, fetchLoadout, fetchInventory, setLoadout } = useLoadoutStore();
  const [activeTab, setActiveTab] = React.useState<Tab>('skins');

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
    enabled: !!token,
  });

  useEffect(() => {
    if (token) {
      fetchLoadout();
      fetchInventory();
    }
  }, [token, fetchLoadout, fetchInventory]);

  const itemsByType = inventory.reduce(
    (acc, inv) => {
      const type = inv.item?.type ?? 'skins';
      if (!acc[type]) acc[type] = [];
      acc[type].push(inv);
      return acc;
    },
    {} as Record<string, InventoryItem[]>
  );

  const currentItems = (itemsByType[activeTab] ?? []) as InventoryItem[];

  const handleEquip = async (item: CosmeticItem) => {
    const update: Record<string, string | null> = {};
    switch (item.type) {
      case 'skin':
        update.skinId = item.id;
        break;
      case 'board':
        update.boardId = item.id;
        break;
      case 'tiles':
        update.tilesId = item.id;
        break;
      case 'effect':
        update.effectId = item.id;
        break;
    }
    await setLoadout({
      ...loadout,
      ...update,
    });
  };

  const isEquipped = (itemId: string) => {
    return (
      loadout.skinId === itemId ||
      loadout.boardId === itemId ||
      loadout.tilesId === itemId ||
      loadout.effectId === itemId
    );
  };

  if (!token) return <Navigate to="/" replace />;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Marketplace
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Inventory
        </h1>
        <Link to="/inventory/loadout">
          <Button variant="secondary">Edit loadout</Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {(['skins', 'boards', 'tiles', 'effects'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-amber-600 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {currentItems.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">
          No {activeTab} yet. Browse the marketplace to get some!
          <Link to="/marketplace" className="block mt-4 text-amber-400 hover:text-amber-300">
            Go to Marketplace →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {currentItems.map((inv) => {
            const item = inv.item;
            if (!item) return null;
            return (
              <div key={inv.id} className="card p-4">
                <div
                  className="w-full h-16 rounded-lg bg-gray-700/50 mb-3 flex items-center justify-center text-2xl"
                  style={{
                    backgroundColor: (item.metadata?.color as string) ?? undefined,
                  }}
                >
                  {item.type === 'skin' && '🎨'}
                  {item.type === 'board' && '🃏'}
                  {item.type === 'tiles' && '🀄'}
                  {item.type === 'effect' && '✨'}
                </div>
                <h3 className="font-medium text-white text-sm truncate">{item.name}</h3>
                <span
                  className={`text-xs ${rarityColors[item.rarity] ?? 'text-gray-400'}`}
                >
                  {item.rarity}
                </span>
                {isEquipped(item.id) ? (
                  <span className="block mt-2 text-xs text-green-400">Equipped</span>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEquip(item)}
                    className="mt-2"
                  >
                    Equip
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
