import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';
import { useQuery } from '@tanstack/react-query';
import { getLoadout } from '../api/marketplace';
import { useSocket } from '../hooks/useSocket';
import { getGame } from '../api/game';
import type { GameSet } from '../../shared/types';
import GameBoard from '../components/Game/GameBoard';
import PlayerHand from '../components/Game/PlayerHand';
import PendingMeld from '../components/Game/PendingMeld';
import EditableBoard from '../components/Game/EditableBoard';
import ScoreBoard from '../components/Game/ScoreBoard';
import TurnIndicator from '../components/Game/TurnIndicator';
import GameTimer from '../components/Game/GameTimer';
import GameChat, { type ChatMessageItem } from '../components/Game/GameChat';
import DragOverlayTile from '../components/dnd/DragOverlayTile';
import {
  handTileId,
  parseHandTileId,
  pendingSetId,
  pendingTileId,
  parsePendingTileId,
  pendingSetRowId,
  parsePendingSetRowId,
  boardSetId,
  boardTileId,
  parseBoardTileId,
  boardSetRowId,
  parseBoardSetRowId,
  AVAILABLE_ZONE,
  parseAvailableTileId,
  DND,
} from '../components/dnd/constants';
import { inferSetType, tempSetId, isValidSet } from '../utils/setValidation';
import type { Tile } from '../../shared/types';

const DEFAULT_TIME_PER_MOVE = 30;

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [selectedTileIds, setSelectedTileIds] = useState<Set<string>>(new Set());
  const [pendingSets, setPendingSets] = useState<GameSet[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [workingBoard, setWorkingBoard] = useState<GameSet[]>([]);
  const [editPool, setEditPool] = useState<Tile[]>([]);
  const [selectedTileForAdd, setSelectedTileForAdd] = useState<string | null>(null);
  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [handOrder, setHandOrder] = useState<string[] | null>(null);
  const [activeDragTile, setActiveDragTile] = useState<Tile | null>(null);
  const prevTurnRef = useRef<number>(-1);

  const game = useGameStore((s) => s.game);
  const currentGameId = useGameStore((s) => s.currentGameId);
  const setGameState = useGameStore((s) => s.setGameState);
  const setCurrentGameId = useGameStore((s) => s.setCurrentGameId);
  const lastScores = useGameStore((s) => s.lastScores);
  const resetGame = useGameStore((s) => s.resetGame);

  const userId = useUserStore((s) => s.userId);
  const token = useUserStore((s) => s.token);

  const { data: loadoutData } = useQuery({
    queryKey: ['loadout', token],
    queryFn: () => getLoadout(true),
    enabled: !!token,
  });
  const loadoutItems = loadoutData?.items ?? {};

  // Set current game id when we have a route param
  useEffect(() => {
    if (gameId) {
      setCurrentGameId(gameId);
    }
    return () => {
      if (gameId && currentGameId === gameId) {
        setCurrentGameId(null);
      }
    };
  }, [gameId, setCurrentGameId, currentGameId]);

  // Load game: from store or API (reload/reconnect)
  useEffect(() => {
    if (!gameId) return;
    if (game?.id === gameId) {
      setLoadError(null);
      return;
    }
    setLoadError(null);
    getGame(gameId)
      .then((g) => {
        setGameState(g);
        setLoadError(null);
      })
      .catch((err) => {
        const message = err?.response?.status === 403
          ? 'You are not in this game'
          : err?.response?.status === 404 || err?.message
            ? 'Game not found'
            : 'Failed to load game';
        setLoadError(message);
      });
  }, [gameId, game?.id, setGameState]);

  const myPlayerIndex = game?.players.findIndex((p) => p.userId === userId) ?? -1;
  const myPlayer = myPlayerIndex >= 0 ? game?.players[myPlayerIndex] : null;
  const handTiles = myPlayer?.tiles ?? [];

  // Update turn start time when it becomes our turn (from game-state)
  useEffect(() => {
    if (!game || myPlayerIndex < 0) return;
    const currentTurn = game.currentPlayerIndex;
    if (currentTurn === myPlayerIndex && currentTurn !== prevTurnRef.current) {
      setTurnStartTime(Date.now());
    }
    prevTurnRef.current = currentTurn;
  }, [game?.currentPlayerIndex, myPlayerIndex, game]);

  const handleChatMessage = useCallback((data: { gameId?: string; message?: string; userId?: string; username?: string; timestamp?: number }) => {
    if (!data.message) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        userId: data.userId ?? '',
        username: data.username ?? 'Someone',
        message: data.message,
        timestamp: data.timestamp ?? Date.now(),
      },
    ]);
  }, []);

  const { emit } = useSocket({ onError: setSocketError, onChatMessage: handleChatMessage });

  const handleSendChat = useCallback(
    (message: string) => {
      if (!gameId || !message.trim()) return;
      emit('chat-message', {
        gameId,
        message: message.trim(),
        userId: userId ?? undefined,
        username: myPlayer?.name ?? userId ?? 'Player',
        timestamp: Date.now(),
      });
    },
    [emit, gameId, userId, myPlayer?.name]
  );

  const tileIdsInPending = useMemo(() => {
    const ids = new Set<string>();
    pendingSets.forEach((s) => s.tiles.forEach((t) => ids.add(t.id)));
    return ids;
  }, [pendingSets]);

  const handleToggleTile = (tileId: string) => {
    if (tileIdsInPending.has(tileId)) return;
    setSelectedTileIds((prev) => {
      const next = new Set(prev);
      if (next.has(tileId)) next.delete(tileId);
      else next.add(tileId);
      return next;
    });
  };

  const handleAddSelectedToPending = () => {
    if (!myPlayer) return;
    const toAdd = myPlayer.tiles.filter((t) => selectedTileIds.has(t.id) && !tileIdsInPending.has(t.id));
    if (toAdd.length === 0) return;
    setPendingSets((prev) => {
      const next = [...prev];
      if (next.length === 0) next.push({ id: tempSetId(), tiles: [], type: 'run' });
      const last = next[next.length - 1];
      next[next.length - 1] = { ...last, tiles: [...last.tiles, ...toAdd] };
      return next;
    });
    setSelectedTileIds((prev) => {
      const next = new Set(prev);
      toAdd.forEach((t) => next.delete(t.id));
      return next;
    });
  };

  const handleNewSet = () => {
    setPendingSets((prev) => [...prev, { id: tempSetId(), tiles: [], type: 'run' }]);
  };

  const handleRemoveTileFromPending = (setId: string, tileId: string) => {
    setPendingSets((prev) =>
      prev
        .map((s) =>
          s.id === setId ? { ...s, tiles: s.tiles.filter((t) => t.id !== tileId) } : s
        )
        .filter((s) => s.tiles.length > 0 || s.id !== setId)
    );
  };

  const handlePlayMeld = () => {
    if (!gameId || !game) return;
    const validSets: GameSet[] = [];
    for (const set of pendingSets) {
      if (set.tiles.length < 3) continue;
      const type = inferSetType(set.tiles);
      if (!type) continue;
      validSets.push({ id: set.id, tiles: set.tiles, type });
    }
    if (validSets.length === 0) return;
    setSocketError(null);
    emit('game-move', { gameId, move: { type: 'meld', sets: validSets } });
    setPendingSets([]);
    setSelectedTileIds(new Set());
    setHandOrder(null);
  };

  const handleStartEditBoard = () => {
    if (!game) return;
    setWorkingBoard(
      game.board.map((s) => ({ ...s, tiles: s.tiles.map((t) => ({ ...t })) }))
    );
    setEditPool([]);
    setSelectedTileForAdd(null);
    setEditMode(true);
  };

  const handleCancelEditBoard = () => {
    setEditMode(false);
    setWorkingBoard([]);
    setEditPool([]);
    setSelectedTileForAdd(null);
  };

  const handleRemoveFromSet = (setId: string, tileId: string) => {
    const tile = workingBoard.flatMap((s) => s.tiles).find((t) => t.id === tileId);
    if (!tile) return;
    setWorkingBoard((prev) =>
      prev
        .map((s) =>
          s.id === setId ? { ...s, tiles: s.tiles.filter((t) => t.id !== tileId) } : s
        )
        .filter((s) => s.tiles.length > 0)
    );
    setEditPool((prev) => [...prev, tile]);
  };

  const handleAddToSet = (setId: string) => {
    if (!selectedTileForAdd || !myPlayer) return;
    const tile =
      editPool.find((t) => t.id === selectedTileForAdd) ??
      myPlayer.tiles.find((t) => t.id === selectedTileForAdd);
    if (!tile) return;
    setWorkingBoard((prev) =>
      prev.map((s) =>
        s.id === setId ? { ...s, tiles: [...s.tiles, tile] } : s
      )
    );
    setEditPool((prev) => prev.filter((t) => t.id !== selectedTileForAdd));
    setSelectedTileForAdd(null);
  };

  // ---- DnD handlers (Step 13) ----
  const orderedHandIds = useMemo(() => {
    if (!handTiles.length) return [];
    if (!handOrder) return handTiles.map((t) => t.id);
    const idSet = new Set(handTiles.map((t) => t.id));
    const kept = handOrder.filter((id) => idSet.has(id));
    const added = handTiles.map((t) => t.id).filter((id) => !handOrder.includes(id));
    return [...kept, ...added];
  }, [handTiles, handOrder]);

  const handleAddTileToPending = useCallback((setId: string, tile: Tile) => {
    if (!myPlayer || !handTiles.some((t) => t.id === tile.id)) return;
    setPendingSets((prev) => {
      const next = [...prev];
      let set = next.find((s) => s.id === setId);
      if (!set) {
        set = { id: setId, tiles: [], type: 'run' };
        next.push(set);
      } else {
        set = { ...set, tiles: [...set.tiles, tile] };
        next[next.findIndex((s) => s.id === setId)] = set;
      }
      return next;
    });
  }, [myPlayer, handTiles]);

  const handleReorderHand = useCallback((newOrder: string[]) => {
    setHandOrder(newOrder);
  }, []);

  const handleReorderPendingSet = useCallback((setId: string, tileIds: string[]) => {
    setPendingSets((prev) =>
      prev.map((s) => {
        if (s.id !== setId) return s;
        const tileMap = new Map(s.tiles.map((t) => [t.id, t]));
        const tiles = tileIds.map((id) => tileMap.get(id)).filter(Boolean) as Tile[];
        return tiles.length ? { ...s, tiles } : s;
      })
    );
  }, []);

  const handleMoveTileBetweenPendingSets = useCallback((fromSetId: string, toSetId: string, tile: Tile, toIndex?: number) => {
    setPendingSets((prev) => {
      let tileFromSet: Tile | null = null;
      const next = prev
        .map((s) => {
          if (s.id === fromSetId) {
            const t = s.tiles.find((x) => x.id === tile.id);
            if (t) tileFromSet = t;
            return { ...s, tiles: s.tiles.filter((t) => t.id !== tile.id) };
          }
          return s;
        })
        .filter((s) => s.tiles.length > 0 || s.id !== fromSetId);
      if (!tileFromSet) return prev;
      const toSet = next.find((s) => s.id === toSetId);
      if (!toSet) {
        next.push({ id: toSetId, tiles: [tileFromSet], type: 'run' });
      } else {
        const idx = next.findIndex((s) => s.id === toSetId);
        const newTiles = [...toSet.tiles];
        const insertAt = toIndex ?? newTiles.length;
        newTiles.splice(insertAt, 0, tileFromSet);
        next[idx] = { ...toSet, tiles: newTiles };
      }
      return next;
    });
  }, []);

  const handleRemoveTileFromPendingToHand = useCallback((setId: string, tileId: string) => {
    setPendingSets((prev) =>
      prev
        .map((s) => (s.id === setId ? { ...s, tiles: s.tiles.filter((t) => t.id !== tileId) } : s))
        .filter((s) => s.tiles.length > 0 || s.id !== setId)
    );
  }, []);

  const handleAddTileToBoardSet = useCallback((setId: string, tile: Tile) => {
    const inHand = myPlayer?.tiles.some((t) => t.id === tile.id);
    const inPool = editPool.some((t) => t.id === tile.id);
    if (!inHand && !inPool) return;
    setWorkingBoard((prev) =>
      prev.map((s) => (s.id === setId ? { ...s, tiles: [...s.tiles, tile] } : s))
    );
    if (inPool) setEditPool((p) => p.filter((t) => t.id !== tile.id));
    setSelectedTileForAdd(null);
  }, [myPlayer?.tiles, editPool]);

  const handleReorderPendingSets = useCallback((setIds: string[]) => {
    setPendingSets((prev) => {
      const map = new Map(prev.map((s) => [s.id, s]));
      const ordered = setIds.map((id) => map.get(id)).filter(Boolean) as GameSet[];
      return ordered.length ? ordered : prev;
    });
  }, []);

  const handleReorderWorkingBoardSets = useCallback((setIds: string[]) => {
    setWorkingBoard((prev) => {
      const map = new Map(prev.map((s) => [s.id, s]));
      const ordered = setIds.map((id) => map.get(id)).filter(Boolean) as GameSet[];
      return ordered.length ? ordered : prev;
    });
  }, []);

  const handleReorderBoardSet = useCallback((setId: string, tileIds: string[]) => {
    setWorkingBoard((prev) =>
      prev.map((s) => {
        if (s.id !== setId) return s;
        const map = new Map(s.tiles.map((t) => [t.id, t]));
        const tiles = tileIds.map((id) => map.get(id)).filter(Boolean) as Tile[];
        return tiles.length ? { ...s, tiles } : s;
      })
    );
  }, []);

  const handleMoveTileBetweenBoardSets = useCallback((fromSetId: string, toSetId: string, tile: Tile, toIndex?: number) => {
    setWorkingBoard((prev) => {
      let tileObj: Tile | null = null;
      const next = prev
        .map((s) => {
          if (s.id === fromSetId) {
            const t = s.tiles.find((x) => x.id === tile.id);
            if (t) tileObj = t;
            return { ...s, tiles: s.tiles.filter((t) => t.id !== tile.id) };
          }
          return s;
        })
        .filter((s) => s.tiles.length > 0);
      if (!tileObj) return prev;
      const toSet = next.find((s) => s.id === toSetId);
      if (!toSet) return prev;
      const idx = next.findIndex((s) => s.id === toSetId);
      const newTiles = [...toSet.tiles];
      newTiles.splice(toIndex ?? newTiles.length, 0, tileObj);
      next[idx] = { ...toSet, tiles: newTiles };
      return next;
    });
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = String(event.active.id);
    if (parsePendingSetRowId(activeId) || parseBoardSetRowId(activeId)) {
      setActiveDragTile(null);
      return;
    }
    const tile = event.active.data.current?.tile as Tile | undefined;
    if (tile) setActiveDragTile(tile);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragTile(null);
      const { active, over } = event;
      if (!over) return;
      const activeId = String(active.id);
      const overId = String(over.id);
      const tile = active.data.current?.tile as Tile | undefined;

      // Reorder pending sets
      const pendingSetRowFrom = parsePendingSetRowId(activeId);
      const pendingSetRowTo = parsePendingSetRowId(overId);
      if (pendingSetRowFrom && pendingSetRowTo && pendingSetRowFrom !== pendingSetRowTo) {
        const setIds = pendingSets.map((s) => s.id);
        const fromIdx = setIds.indexOf(pendingSetRowFrom);
        const toIdx = setIds.indexOf(pendingSetRowTo);
        if (fromIdx >= 0 && toIdx >= 0) {
          handleReorderPendingSets(arrayMove(setIds, fromIdx, toIdx));
        }
        return;
      }

      // Reorder board sets (edit mode)
      const boardSetRowFrom = parseBoardSetRowId(activeId);
      const boardSetRowTo = parseBoardSetRowId(overId);
      if (editMode && boardSetRowFrom && boardSetRowTo && boardSetRowFrom !== boardSetRowTo) {
        const setIds = workingBoard.map((s) => s.id);
        const fromIdx = setIds.indexOf(boardSetRowFrom);
        const toIdx = setIds.indexOf(boardSetRowTo);
        if (fromIdx >= 0 && toIdx >= 0) {
          handleReorderWorkingBoardSets(arrayMove(setIds, fromIdx, toIdx));
        }
        return;
      }

      if (!tile) return;

      const handTile = parseHandTileId(activeId);
      const pendingParsed = parsePendingTileId(activeId);
      const boardParsed = parseBoardTileId(activeId);
      const availableTile = parseAvailableTileId(activeId);

      // Dropped on available zone: return from board to edit pool
      if (overId === AVAILABLE_ZONE && editMode && boardParsed) {
        handleRemoveFromSet(boardParsed.setId, boardParsed.tileId);
        return;
      }

      // Dropped on hand: reorder hand or return from pending
      if (overId === DND.HAND || (overId.startsWith(DND.HAND_TILE_PREFIX) && overId !== activeId)) {
        if (pendingParsed) {
          handleRemoveTileFromPendingToHand(pendingParsed.setId, pendingParsed.tileId);
          return;
        }
        if (handTile) {
          const currentOrder = orderedHandIds;
          const fromIdx = currentOrder.indexOf(tile.id);
          if (fromIdx < 0) return;
          let toIdx = currentOrder.indexOf(parseHandTileId(overId) ?? '');
          if (toIdx < 0) toIdx = currentOrder.length - 1;
          if (fromIdx !== toIdx) setHandOrder(arrayMove(currentOrder, fromIdx, toIdx));
        }
        return;
      }

      // Dropped on pending set
      if (overId.startsWith(DND.PENDING_PREFIX) && !overId.startsWith(DND.PENDING_TILE_PREFIX)) {
        const toSetId = overId.slice(DND.PENDING_PREFIX.length);
        if (handTile) {
          handleAddTileToPending(toSetId, tile);
          return;
        }
        if (pendingParsed && pendingParsed.setId !== toSetId) {
          handleMoveTileBetweenPendingSets(pendingParsed.setId, toSetId, tile);
          return;
        }
      }
      if (parsePendingTileId(overId) && pendingParsed) {
        const to = parsePendingTileId(overId)!;
        const toSet = pendingSets.find((s) => s.id === to.setId);
        if (pendingParsed.setId === to.setId && toSet) {
          const ids = toSet.tiles.map((t) => t.id);
          const fromIdx = ids.indexOf(tile.id);
          const toIdx = ids.indexOf(to.tileId);
          if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
            handleReorderPendingSet(to.setId, arrayMove(ids, fromIdx, toIdx));
          }
        } else if (toSet) {
          handleMoveTileBetweenPendingSets(pendingParsed.setId, to.setId, tile, toSet.tiles.findIndex((t) => t.id === to.tileId));
        }
        return;
      }

      // Edit mode: dropped on board set
      if (editMode && (overId.startsWith(DND.BOARD_PREFIX) && overId !== DND.POOL)) {
        const toSetId = overId.startsWith(DND.BOARD_TILE_PREFIX)
          ? parseBoardTileId(overId)?.setId
          : overId.slice(DND.BOARD_PREFIX.length);
        if (!toSetId) return;
        if (handTile || editPool.some((t) => t.id === tile.id) || availableTile) {
          handleAddTileToBoardSet(toSetId, tile);
          return;
        }
        if (boardParsed) {
          const to = parseBoardTileId(overId);
          const toBoardSet = to ? workingBoard.find((s) => s.id === to.setId) : undefined;
          if (to && toBoardSet && boardParsed.setId !== to.setId) {
            handleMoveTileBetweenBoardSets(boardParsed.setId, to.setId, tile, toBoardSet.tiles.findIndex((t) => t.id === to.tileId));
          } else if (to && toBoardSet && boardParsed.setId === to.setId) {
            const ids = toBoardSet.tiles.map((t) => t.id);
            const fromIdx = ids.indexOf(tile.id);
            const toIdx = ids.indexOf(to.tileId);
            if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
              handleReorderBoardSet(to.setId, arrayMove(ids, fromIdx, toIdx));
            }
          }
        }
      }
    },
    [
      orderedHandIds,
      pendingSets,
      workingBoard,
      editMode,
      editPool,
      handleAddTileToPending,
      handleReorderPendingSet,
      handleReorderPendingSets,
      handleReorderWorkingBoardSets,
      handleMoveTileBetweenPendingSets,
      handleRemoveTileFromPendingToHand,
      handleAddTileToBoardSet,
      handleReorderBoardSet,
      handleMoveTileBetweenBoardSets,
    ]
  );

  const handleSubmitBoard = () => {
    if (!gameId) return;
    const allValid = workingBoard.length > 0 && workingBoard.every((s) => s.tiles.length >= 3 && isValidSet(s.tiles));
    if (!allValid) return;
    setSocketError(null);
    emit('game-move', { gameId, move: { type: 'manipulate', sets: workingBoard } });
    setEditMode(false);
    setWorkingBoard([]);
    setEditPool([]);
    setSelectedTileForAdd(null);
  };

  const tilesInWorkingBoard = useMemo(() => {
    const ids = new Set<string>();
    workingBoard.forEach((s) => s.tiles.forEach((t) => ids.add(t.id)));
    return ids;
  }, [workingBoard]);

  const handleDraw = () => {
    if (gameId) {
      setSocketError(null);
      emit('game-draw-tile', { gameId });
    }
  };

  const handleEndTurn = () => {
    if (gameId) {
      setSocketError(null);
      emit('game-end-turn', { gameId });
    }
  };

  const handleBackToLobby = () => {
    resetGame();
    navigate('/rooms');
  };

  const handleLeaveClick = () => setShowLeaveConfirm(true);
  const handleLeaveConfirm = () => {
    resetGame();
    setShowLeaveConfirm(false);
    navigate('/rooms');
  };
  const handleLeaveCancel = () => setShowLeaveConfirm(false);

  // Auto-dismiss socket error after 5s
  useEffect(() => {
    if (!socketError) return;
    const t = setTimeout(() => setSocketError(null), 5000);
    return () => clearTimeout(t);
  }, [socketError]);

  if (!token) {
    return (
      <main className="max-w-md mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="card p-8 sm:p-10 text-center w-full animate-fade-in-up">
          <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-gray-700/50 flex items-center justify-center text-2xl text-gray-500" aria-hidden>🔒</div>
          <p className="text-gray-300 mb-6 text-base">Sign in to play.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-500 active:scale-[0.98] transition-all duration-200"
          >
            <span aria-hidden>←</span> Back to home
          </Link>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="max-w-md mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="rounded-xl border border-red-700/60 bg-red-900/30 p-6 sm:p-8 w-full animate-fade-in-up" role="alert">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0" aria-hidden>⚠</span>
            <div>
              <h3 className="text-lg font-semibold text-red-200 mb-1">Error</h3>
              <p className="text-red-200/90 text-sm mb-6">{loadError}</p>
              <Link
                to="/rooms"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-500 active:scale-[0.98] transition-all duration-200"
              >
                <span aria-hidden>←</span> Back to rooms
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!game || game.id !== gameId) {
    return (
      <div className="p-8 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[240px] animate-fade-in">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-5" aria-hidden />
        <p className="text-gray-400">Loading game…</p>
      </div>
    );
  }

  if (game.status === 'finished') {
    const winner = game.players.find((p) => p.userId === game.winnerId);
    const isWinner = winner?.userId === userId;
    return (
      <div className="px-4 py-10 max-w-md mx-auto animate-fade-in">
        <div className="card p-6 sm:p-10 text-center space-y-6 animate-fade-in-up">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl ${isWinner ? 'bg-amber-500/20' : 'bg-gray-700/50'}`} aria-hidden>
            {isWinner ? '🏆' : '🎲'}
          </div>
          <h2 className="text-2xl font-bold text-white">Game over</h2>
          <p className={isWinner ? 'text-amber-400 font-semibold text-lg' : 'text-gray-300'}>
            {isWinner ? 'You won!' : `Winner: ${winner?.name ?? game.winnerId ?? '—'}`}
          </p>
          {lastScores && (
            <ul className="text-sm text-gray-400 space-y-2 pt-4 border-t border-gray-600/80">
              {Object.entries(lastScores).map(([id, delta]) => {
                const p = game.players.find((x) => x.userId === id);
                return (
                  <li key={id} className="flex justify-between py-1">
                    <span>{p?.name ?? id}</span>
                    <span className="tabular-nums font-medium">{delta > 0 ? '+' : ''}{delta}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            onClick={handleBackToLobby}
            className="w-full mt-2 px-4 py-3.5 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-500 active:scale-[0.98] transition-all duration-200"
          >
            Back to lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-4xl mx-auto space-y-5 sm:space-y-6 animate-fade-in">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <TurnIndicator
          currentPlayerIndex={game.currentPlayerIndex}
          players={game.players}
          myUserId={userId}
        />
        <button
          type="button"
          onClick={handleLeaveClick}
          className="text-sm text-gray-400 hover:text-white py-2 px-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200"
        >
          Leave game
        </button>
      </div>

      {socketError && (
        <div
          className="flex items-center gap-3 rounded-xl bg-red-900/40 border border-red-700/60 px-4 py-3.5 text-sm text-red-200 animate-fade-in-up"
          role="alert"
        >
          <span className="shrink-0 text-red-400 text-lg" aria-hidden>⚠</span>
          <span className="flex-1">{socketError}</span>
          <button
            type="button"
            onClick={() => setSocketError(null)}
            className="shrink-0 p-2 rounded-lg hover:bg-red-800/50 transition-all duration-150"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {showLeaveConfirm && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-dialog-title"
        >
          <div className="rounded-2xl border border-gray-600/80 bg-gray-800 p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <h3 id="leave-dialog-title" className="text-lg font-semibold text-white mb-2">Leave this game?</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">You can rejoin from the room if the game is still in progress.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleLeaveCancel}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-600 text-white font-medium hover:bg-gray-500 active:scale-[0.98] transition-all duration-150"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLeaveConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-500 active:scale-[0.98] transition-all duration-150"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="lg:col-span-3">
          {editMode ? (
            <EditableBoard
              workingBoard={workingBoard}
              editPool={editPool}
              handTiles={myPlayer?.tiles ?? []}
              tilesInWorkingBoard={tilesInWorkingBoard}
              selectedTileId={selectedTileForAdd}
              onRemoveFromSet={handleRemoveFromSet}
              onSelectTileForAdd={setSelectedTileForAdd}
              onAddToSet={handleAddToSet}
              onReorderSets={handleReorderWorkingBoardSets}
              onSubmitBoard={handleSubmitBoard}
              onCancelEdit={handleCancelEditBoard}
              disabled={game.currentPlayerIndex !== myPlayerIndex}
              submitDisabled={
                workingBoard.length === 0 ||
                workingBoard.some((s) => s.tiles.length < 3 || !isValidSet(s.tiles))
              }
            />
          ) : (
            <>
              <GameBoard board={game.board} loadoutItems={loadoutItems} />
              {myPlayer && game.currentPlayerIndex === myPlayerIndex && (
                <button
                  type="button"
                  onClick={handleStartEditBoard}
                  className="mt-3 px-4 py-2.5 rounded-xl bg-gray-600 text-white text-sm font-medium hover:bg-gray-500 active:scale-[0.98] transition-all duration-150"
                >
                  Edit board (rearrange)
                </button>
              )}
            </>
          )}
        </div>
        <div>
          <ScoreBoard players={game.players} currentPlayerIndex={game.currentPlayerIndex} />
        </div>
      </div>

      {myPlayer && (
        <>
          <PendingMeld
            sets={pendingSets}
            onRemoveTile={handleRemoveTileFromPending}
            onReorderSets={handleReorderPendingSets}
            onPlayMeld={handlePlayMeld}
            onNewSet={handleNewSet}
            disabled={game.currentPlayerIndex !== myPlayerIndex}
            isMyTurn={game.currentPlayerIndex === myPlayerIndex}
          />
          <PlayerHand
            tiles={handTiles}
            handOrder={orderedHandIds}
            isMyTurn={game.currentPlayerIndex === myPlayerIndex}
            gameId={game.id}
            selectedTileIds={selectedTileIds}
            tileIdsInPending={tileIdsInPending}
            onToggleTile={handleToggleTile}
            onAddSelectedToPending={handleAddSelectedToPending}
            onHandReorder={handleReorderHand}
            onDraw={handleDraw}
            onEndTurn={handleEndTurn}
          />
        </>
      )}

      <div className="flex flex-wrap items-start gap-4 sm:gap-5 pt-1">
        <GameTimer
          timeLimitSeconds={DEFAULT_TIME_PER_MOVE}
          isMyTurn={game.currentPlayerIndex === myPlayerIndex}
          turnStartTime={turnStartTime}
          onTimeUp={game.currentPlayerIndex === myPlayerIndex ? handleEndTurn : undefined}
        />
        <div className="min-w-[240px] max-w-[320px]">
          <GameChat
            messages={chatMessages}
            onSend={handleSendChat}
            disabled={!gameId}
          />
        </div>
      </div>

      <DragOverlay
        dropAnimation={{
          duration: 150,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeDragTile ? <DragOverlayTile tile={activeDragTile} size="medium" /> : null}
      </DragOverlay>
    </DndContext>
  );
}
