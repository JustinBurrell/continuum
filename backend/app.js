const Sentry = require('@sentry/node');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoSanitize = require('mongo-sanitize');
const pinoHttp = require('pino-http');
const swaggerUi = require('swagger-ui-express');
const logger = require('./lib/logger');
const swaggerSpec = require('./lib/swagger');
const { apiLimiter } = require('./middleware/rateLimiter');
const passport = require('./config/passport');

const app = express();

// Trust the first proxy hop (Render's load balancer) so req.ip returns the real client IP
// from the X-Forwarded-For header rather than the load balancer's internal address.
app.set('trust proxy', 1);

// Suppress HTTP request logs during tests
if (process.env.NODE_ENV !== 'test') {
  app.use(pinoHttp({ logger }));
}

app.use(helmet({ contentSecurityPolicy: false }));
app.disable('x-powered-by');

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
];
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Type'],
}));

app.use(cookieParser());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.params = mongoSanitize(req.params);
  req.query = mongoSanitize(req.query);
  next();
});

app.use(passport.initialize());

// Global rate limit
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/notes', require('./routes/notes.routes'));
app.use('/api/google', require('./routes/google.routes'));
app.use('/api/flashcard-sets', require('./routes/flashcardSets.routes'));
app.use('/api/study-sessions', require('./routes/studySessions.routes'));
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
app.use('/api/notifications', require('./routes/notifications.routes'));
app.use('/api/sync', require('./routes/sync.routes'));
app.use('/api/waitlist', require('./routes/waitlist.routes'));

// Share pages — public HTML with OG meta tags, no /api prefix
// (Vercel proxies https://usecontinuum.dev/share/* → https://api.usecontinuum.dev/share/*)
app.use('/share', require('./routes/share.routes'));

// API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

Sentry.setupExpressErrorHandler(app);

// Global error handler
app.use((err, req, res, next) => {
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, error: messages.join(', ') });
  }
  if (err.status === 413 || err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Your note is too large to save. Try shortening the content.' });
  }
  const message =
    process.env.NODE_ENV === 'production' && !err.status
      ? 'Internal server error'
      : err.message;
  if (process.env.NODE_ENV !== 'test') {
    logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');
  }
  res.status(err.status || 500).json({ success: false, error: message });
});

module.exports = app;
