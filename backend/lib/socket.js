const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

let io = null;

/**
 * Initialise Socket.io on the given HTTP server.
 * Call once from server.js before listen().
 */
async function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Redis pub/sub adapter — enables event delivery across multiple backend instances.
  // No-op in single-instance deployments; required when running replicas or PM2 cluster.
  // Fail-open: if Redis is unreachable (down, quota exceeded, etc.), log and continue
  // without the adapter rather than blocking the HTTP server from ever starting.
  if (process.env.REDIS_URL) {
    try {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
    } catch (err) {
      logger.warn({ err }, 'Redis pub/sub adapter unavailable — running single-instance without it');
    }
  }

  // Verify JWT on every socket handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Each user joins their own private room — controllers emit to "user:<id>"
    socket.join(`user:${socket.userId}`);
  });

  return io;
}

/** Returns the io instance. Must be called after initSocket(). */
function getIO() {
  if (!io) throw new Error('Socket.io not initialised — call initSocket() first');
  return io;
}

module.exports = { initSocket, getIO };
