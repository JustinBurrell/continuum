require('dotenv').config();
require('express-async-errors'); // patches Express to forward async errors to the global handler
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const mongoSanitize = require('mongo-sanitize');
const pinoHttp = require('pino-http');
const logger = require('./lib/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const connectDB = require('./config/database');
const passport = require('./config/passport');
const { initSocket } = require('./lib/socket');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(pinoHttp({ logger }));
app.use(helmet());
app.disable('x-powered-by');
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.error('FATAL: FRONTEND_URL is not set — CORS will block all browser requests in production');
  process.exit(1);
}
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(bodyParser.json({ limit: '200kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '200kb' }));

// Strip MongoDB operator keys ($gt, $where, etc.) from all incoming data
app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.params = mongoSanitize(req.params);
  req.query = mongoSanitize(req.query);
  next();
});

app.use(passport.initialize());

// Global rate limit — applied before all routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/notes', require('./routes/notes.routes'));
app.use('/api/google', require('./routes/google.routes'));
app.use('/api/flashcard-sets', require('./routes/flashcardSets.routes'));
app.use('/api/tasks', require('./routes/tasks.routes'));
app.use('/api/calendar', require('./routes/calendar.routes'));
app.use('/api/friends', require('./routes/friends.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/comments', require('./routes/comments.routes'));
app.use('/api/applications', require('./routes/applications.routes'));
app.use('/api/resumes', require('./routes/resumes.routes'));
app.use('/api/conversations', require('./routes/conversations.routes'));
app.use('/api/messages', require('./routes/messages.routes'));
app.use('/api/activity', require('./routes/activity.routes'));
app.use('/api/sync', require('./routes/sync.routes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Global error handler — must be last middleware
app.use((err, req, res, next) => {
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, error: messages.join(', ') });
  }
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');
  res.status(err.status || 500).json({ success: false, error: message });
});

// Start server
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
initSocket(httpServer).then(() => {
  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
  });
});

// Process-level error handlers — catch anything that escapes Express
process.on('unhandledRejection', (reason) => {
  logger.error({ reason: String(reason) }, 'unhandledRejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException');
  process.exit(1);
});

module.exports = app;