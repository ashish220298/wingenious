const app = require('./app');
const { connect } = require('./config/database');
const { setupWebsocket } = require('./config/websocket');
const { logger } = require('./utils/logger');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connect();
    const server = app.start(PORT);
    setupWebsocket(server);
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});