import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import { migrateEmbeddedMatchReviews } from './controllers/reviewController.js';
import { setIO } from './socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*';

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

setIO(io);

const PORT = process.env.PORT || 5000;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  // Join user room for targeted notifications
  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user_${String(userId)}`);
    }
  });

  // Join match room(s) by ID (either 8-digit numericMatchId or matchId or array)
  socket.on('join_match', (matchId) => {
    if (!matchId) return;
    const ids = Array.isArray(matchId) ? matchId : [matchId];
    ids.forEach((id) => {
      const strId = String(id).trim();
      if (!strId) return;
      socket.join(strId);
      // If id is match-<digits>, also join the numeric suffix room
      const numSuffix = strId.replace(/\D/g, '').slice(-8);
      if (numSuffix && numSuffix !== strId) {
        socket.join(numSuffix);
      }
    });
  });

  socket.on('leave_match', (matchId) => {
    if (!matchId) return;
    const ids = Array.isArray(matchId) ? matchId : [matchId];
    ids.forEach((id) => {
      const strId = String(id).trim();
      if (!strId) return;
      socket.leave(strId);
      const numSuffix = strId.replace(/\D/g, '').slice(-8);
      if (numSuffix && numSuffix !== strId) {
        socket.leave(numSuffix);
      }
    });
  });
});

// Start HTTP Server after initializing DB connection check
const startServer = async () => {
  await connectDB();
  await migrateEmbeddedMatchReviews();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TappaScore Backend & Socket.IO running on http://0.0.0.0:${PORT} (Port ${PORT})`);
  });
};

startServer();