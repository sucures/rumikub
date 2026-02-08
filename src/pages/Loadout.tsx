import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInventory, getLoadout, setLoadout as apiSetLoadout } from '../api/marketplace';
import type { CosmeticItem, Loadout } from '../api/marketplace';
import { useUserStore } from '../store/userStore';
import { useLoadoutStore } from '../store/loadoutStore';
import Button from '../components/ui/Button';

export default function LoadoutPage() {
  const { token } = useUserStore();
  const { loadout, fetchLoadout } = useLoadoutStore();
  const queryClient = useQueryClient();
  const [localLoadout, setLocalLoadout] = useState<Loadout>({
    skinId: null,
    boardId: null,
    tilesId: null,
    effectId: null,
  });
  const [saved, setSaved] = useState(false);

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
    enabled: !!token,
  });

  const { data: currentLoadout } = useQuery({
    queryKey: ['loadout'],
    queryFn: getLoadout,
    enabled: !!token,
  });

  useEffect(() => {
    if (currentLoadout) {
      setLocalLoadout(currentLoadout);
    }
  }, [currentLoadout]);

  const setLoadoutMutation = useMutation({
    mutationFn: (loadout: Loadout) => apiSetLoadout(loadout),
    onSuccess: () => {
      fetchLoadout();
      queryClient.invalidateQueries({ queryKey: ['loadout'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    setLoadoutMutation.mutate(localLoadout);
  };

  const selectItem = (item: CosmeticItem) => {
    switch (item.type) {
      case 'skin':
        setLocalLoadout((l) => ({ ...l, skinId: item.id }));
        break;
      case 'board':
        setLocalLoadout((l) => ({ ...l, boardId: item.id }));
        break;
      case 'tiles':
        setLocalLoadout((l) => ({ ...l, tilesId: item.id }));
        break;
      case 'effect':
        setLocalLoadout((l) => ({ ...l, effectId: item.id }));
        break;
    }
  };

  const clearSlot = (slot: keyof Loadout) => {
    setLocalLoadout((l) => ({ ...l, [slot]: null }));
  };

  if (!token) return <Navigate to="/" replace />;

  const skinItems = inventory.filter((i) => i.item?.type === 'skin');
  const boardItems = inventory.filter((i) => i.item?.type === 'board');
  const tilesItems = inventory.filter((i) => i.item?.type === 'tiles');
  const effectItems = inventory.filter((i) => i.item?.type === 'effect');

  const SlotSelector = ({
    slot,
    label,
    items,
  }: {
    slot: keyof Loadout;
    label: string;
    items: { item?: CosmeticItem }[];
  }) => {
    const selectedId = localLoadout[slot];

    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-300 mb-2">{label}</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => clearSlot(slot)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              !selectedId
                ? 'bg-amber-600 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            }`}
          >
            None
          </button>
          {items.map((inv) => {
            const item = inv.item;
            if (!item) return null;
            const isSelected = selectedId === item.id;
            return (
              <button
                key={inv.id}
                type="button"
                onClick={() => selectItem(item)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  isSelected
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to="/inventory"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Inventory
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
        Loadout
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        Choose your skin, board, tiles, and effect. Your loadout will be shown in matches.
      </p>

      <div className="card p-6">
        <SlotSelector slot="skinId" label="Skin" items={skinItems} />
        <SlotSelector slot="boardId" label="Board" items={boardItems} />
        <SlotSelector slot="tilesId" label="Tiles" items={tilesItems} />
        <SlotSelector slot="effectId" label="Effect" items={effectItems} />

        {saved && (
          <div className="mb-4 p-3 rounded-lg bg-green-900/20 text-green-400 text-sm">
            Loadout saved!
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={setLoadoutMutation.isPending}
        >
          {setLoadoutMutation.isPending ? 'Saving...' : 'Save loadout'}
        </Button>
      </div>
    </main>
  );
}
