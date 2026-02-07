import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Routes
import partnerRoutes from './routes/partnerRoutes.js';
import cryptoRoutes from './routes/cryptoRoutes.js';
import socialRoutes from './routes/socialRoutes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/partners', partnerRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/social', socialRoutes);

// WebSocket para tiempo real (juegos, chat, notificaciones)
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Unirse a una sala de juego
  socket.on('join-game', (gameId) => {
    socket.join(`game:${gameId}`);
    socket.to(`game:${gameId}`).emit('player-joined', { playerId: socket.id });
  });

  // Salir de una sala de juego
  socket.on('leave-game', (gameId) => {
    socket.leave(`game:${gameId}`);
    socket.to(`game:${gameId}`).emit('player-left', { playerId: socket.id });
  });

  // Enviar mensaje de chat
  socket.on('chat-message', (data) => {
    io.to(`game:${data.gameId}`).emit('chat-message', data);
  });

  // Movimiento en el juego
  socket.on('game-move', (data) => {
    io.to(`game:${data.gameId}`).emit('game-move', data);
  });

  // Notificaciones
  socket.on('subscribe-notifications', (userId) => {
    socket.join(`notifications:${userId}`);
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
});

export { io };
