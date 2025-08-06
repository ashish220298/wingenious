const express = require('express');
const router = express.Router();
const WorkerController = require('../controllers/worker.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/analytics/generate',
  authenticate,
  authorize('admin'),
  WorkerController.generateAnalytics
);

router.post('/batch/process',
  authenticate,
  authorize('admin'),
  WorkerController.processOrders
);

router.get('/status',
  authenticate,
  WorkerController.getStatus
);

module.exports = router;