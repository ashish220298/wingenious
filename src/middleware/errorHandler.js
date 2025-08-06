const { logger } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details || null;

  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      success: false,
      message
    });
  } else {
    res.status(statusCode).json({
      success: false,
      message,
      details,
      stack: err.stack
    });
  }
}

function notFound(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};