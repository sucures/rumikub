import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useUserStore } from '../store/userStore';
import { useGameStore } from '../store/gameStore';

const wsUrl = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

export interface ChatMessagePayload {
  gameId?: string;
  message?: string;
  userId?: string;
  username?: string;
  timestamp?: number;
}

interface UseSocketOptions {
  onError?: (message: string) => void;
  onChatMessage?: (data: ChatMessagePayload) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { onError, onChatMessage } = options;
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const token = useUserStore((s) => s.token);
  const currentGameId = useGameStore((s) => s.currentGameId);
  const setGameState = useGameStore((s) => s.setGameState);
  const setLastScores = useGameStore((s) => s.setLastScores);

  const emit = useCallback((event: string, payload: unknown) => {
    socketRef.current?.emit(event, payload);
  }, []);

  useEffect(() => {
    const socket = io(wsUrl, { autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (token) {
        socket.emit('authenticate', { token });
      }
      const gameId = useGameStore.getState().currentGameId;
      if (gameId) {
        socket.emit('join-game', { gameId });
      }
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('game-state', (game: import('../../shared/types').Game) => {
      setGameState(game);
    });

    socket.on('game-finished', (data: { game: import('../../shared/types').Game; scores?: Record<string, number> }) => {
      setGameState(data.game);
      if (data.scores) setLastScores(data.scores);
    });

    socket.on('error', (data: { message?: string }) => {
      const msg = typeof data?.message === 'string' ? data.message : 'Socket error';
      console.error('Socket error:', msg);
      onError?.(msg);
    });

    socket.on('chat-message', (data: ChatMessagePayload) => {
      onChatMessage?.(data);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, setGameState, setLastScores, onError, onChatMessage]);

  useEffect(() => {
    if (connected && currentGameId && socketRef.current) {
      socketRef.current.emit('join-game', { gameId: currentGameId });
    }
  }, [connected, currentGameId]);

  return { connected, emit };
}
