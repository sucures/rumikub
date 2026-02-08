import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

// Routes
import partnerRoutes from './routes/partnerRoutes.js';
import cryptoRoutes from './routes/cryptoRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import authRoutes from './routes/authRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import friendsRoutes from './routes/friendsRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import antiCheatRoutes from './routes/antiCheatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import motivationRoutes from './routes/motivationRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import { startScheduler } from './scheduler/scheduler.js';
import { activeGameStore } from './services/activeGameStore.js';
import { antiCheatService } from './services/antiCheatService.js';
import { profileService } from './services/profileService.js';
import {
  validateMove,
  checkWin,
  computeScores,
} from './services/gameLogicService.js';
import type { Move } from '../../../shared/types';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

// CORS: production = allow only FRONTEND_URL (comma-separated); development = allow all
function getAllowedOrigins(): string | string[] | true {
  if (isProduction && process.env.FRONTEND_URL) {
    const origins = process.env.FRONTEND_URL.split(',').map((o) => o.trim()).filter(Boolean);
    return origins.length > 0 ? origins : true;
  }
  return process.env.FRONTEND_URL || true;
}
const corsOrigin = getAllowedOrigins();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: Array.isArray(corsOrigin) ? corsOrigin : corsOrigin === true ? '*' : corsOrigin,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging: 5xx always; all requests in production
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const log = `${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`;
    if (res.statusCode >= 500) console.error(log);
    else if (isProduction) console.log(log);
  });
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 100,
});
app.use('/api/', limiter);

// Health check (no auth) — for load balancers, Render, Fly.io, Railway
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: isProduction ? 'production' : process.env.NODE_ENV || 'development',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/wallet', tokenRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/anti-cheat', antiCheatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/motivation', motivationRoutes);
app.use('/api/rumi-wallet', walletRoutes);
app.use('/api/security', securityRoutes);

// WebSocket: real-time games, chat, notifications
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', (data: { token?: string }) => {
    try {
      const token = data?.token;
      if (!token) {
        socket.emit('error', { message: 'No token provided' });
        return;
      }
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      ) as { userId: string };
      (socket.data as { userId?: string }).userId = decoded.userId;
      socket.join(`user:${decoded.userId}`);
    } catch {
      socket.emit('error', { message: 'Invalid token' });
    }
  });

  socket.on('join-room', (data: { roomId?: string }) => {
    const roomId = data?.roomId;
    if (roomId) socket.join(`room:${roomId}`);
  });

  socket.on('leave-room', (data: { roomId?: string }) => {
    const roomId = data?.roomId;
    if (roomId) socket.leave(`room:${roomId}`);
  });

  socket.on('join-game', (data: { gameId?: string }) => {
    const gameId = data?.gameId;
    if (!gameId) return;
    socket.join(`game:${gameId}`);
    const game = activeGameStore.getGame(gameId);
    if (game) socket.emit('game-state', game);
    else socket.emit('error', { message: 'Game not found' });
  });

  socket.on('leave-game', (data: { gameId?: string }) => {
    const gameId = data?.gameId;
    if (gameId) socket.leave(`game:${gameId}`);
  });

  socket.on('game-move', (data: { gameId?: string; move?: unknown }) => {
    const userId = (socket.data as { userId?: string }).userId;
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }
    const { gameId, move } = data ?? {};
    if (!gameId || !move || typeof move !== 'object') {
      socket.emit('error', { message: 'gameId and move required' });
      return;
    }
    const game = activeGameStore.getGame(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    const playerIndex = game.players.findIndex((p) => p.userId === userId);
    if (playerIndex < 0) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }
    const result = validateMove(game, playerIndex, move as Move);
    if (!result.valid) {
      antiCheatService
        .recordSuspiciousEvent(userId, 'invalid_move', 'low', { error: result.error, gameId }, gameId)
        .catch(() => {});
      socket.emit('error', { message: result.error ?? 'Invalid move' });
      return;
    }
    antiCheatService
      .logAction(gameId, userId, 'move', move as Record<string, unknown>)
      .catch(() => {});
    const newGame = result.game!;
    if (checkWin(newGame.players[playerIndex])) {
      newGame.status = 'finished';
      newGame.winnerId = newGame.players[playerIndex].userId;
      const scores = computeScores(newGame, playerIndex);
      activeGameStore.setGame(gameId, newGame);
      newGame.players.forEach((p: { userId: string }, i: number) => {
        profileService.incrementGameStats(p.userId, i === playerIndex).catch(() => {});
      });
      io.to(`game:${gameId}`).emit('game-finished', { game: newGame, scores });
      return;
    }
    activeGameStore.setGame(gameId, newGame);
    io.to(`game:${gameId}`).emit('game-state', newGame);
    io.to(`game:${gameId}`).emit('turn-changed', {
      currentPlayerIndex: newGame.currentPlayerIndex,
    });
  });

  socket.on('game-draw-tile', (data: { gameId?: string }) => {
    const userId = (socket.data as { userId?: string }).userId;
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }
    const gameId = data?.gameId;
    if (!gameId) {
      socket.emit('error', { message: 'gameId required' });
      return;
    }
    const game = activeGameStore.getGame(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    const playerIndex = game.players.findIndex((p) => p.userId === userId);
    if (playerIndex < 0) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }
    const result = validateMove(game, playerIndex, { type: 'draw' });
    if (!result.valid) {
      antiCheatService
        .recordSuspiciousEvent(userId, 'invalid_move', 'low', { error: result.error, gameId }, gameId)
        .catch(() => {});
      socket.emit('error', { message: result.error ?? 'Cannot draw' });
      return;
    }
    antiCheatService.logAction(gameId, userId, 'draw', {}).catch(() => {});
    activeGameStore.setGame(gameId, result.game!);
    io.to(`game:${gameId}`).emit('game-state', result.game);
  });

  socket.on('game-end-turn', (data: { gameId?: string; move?: unknown }) => {
    const userId = (socket.data as { userId?: string }).userId;
    if (!userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }
    const gameId = data?.gameId;
    if (!gameId) {
      socket.emit('error', { message: 'gameId required' });
      return;
    }
    const game = activeGameStore.getGame(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    const playerIndex = game.players.findIndex((p) => p.userId === userId);
    if (playerIndex < 0) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }
    const result = validateMove(game, playerIndex, { type: 'end_turn' });
    if (!result.valid) {
      antiCheatService
        .recordSuspiciousEvent(userId, 'invalid_move', 'low', { error: result.error, gameId }, gameId)
        .catch(() => {});
      socket.emit('error', { message: result.error ?? 'Cannot end turn' });
      return;
    }
    antiCheatService.logAction(gameId, userId, 'end_turn', {}).catch(() => {});
    activeGameStore.setGame(gameId, result.game!);
    io.to(`game:${gameId}`).emit('game-state', result.game);
    io.to(`game:${gameId}`).emit('turn-changed', {
      currentPlayerIndex: result.game!.currentPlayerIndex,
    });
  });

  socket.on('chat-message', (data: { gameId?: string; message?: string }) => {
    const gameId = data?.gameId;
    if (gameId) io.to(`game:${gameId}`).emit('chat-message', data);
  });

  socket.on('subscribe-notifications', (data: { userId?: string }) => {
    const userId = data?.userId;
    if (userId) socket.join(`notifications:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API: http://localhost:${PORT}/api`);
  console.log(`⚡ WebSocket: ws://localhost:${PORT}`);
  startScheduler();
});

export { io };
