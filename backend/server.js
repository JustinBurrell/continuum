require('dotenv').config();
require('./instrument');
const http = require('http');
const logger = require('./lib/logger');
const connectDB = require('./config/database');
const { initSocket } = require('./lib/socket');
const app = require('./app');

// Connect to MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

initSocket(httpServer).then(() => {
  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
  });
});

// Process-level error handlers
process.on('unhandledRejection', (reason) => {
  logger.error({ reason: String(reason) }, 'unhandledRejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException');
  process.exit(1);
});

module.exports = app;
