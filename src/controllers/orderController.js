const WorkerService = require('../services/workerservice');
const { createError } = require('../utils/errorHandler');

class WorkerController {
  static async generateAnalytics(req, res, next) {
    try {
      await WorkerService.generateDailyAnalytics();
      res.json({
        success: true,
        message: 'Analytics generation started'
      });
    } catch (error) {
      next(createError(500, 'Failed to start analytics generation'));
    }
  }

  static async processOrders(req, res, next) {
    try {
      const { query, batchSize } = req.body;
      const result = await WorkerService.processBatchOrders(query, batchSize);
      res.json({
        success: true,
        processed: result.processed
      });
    } catch (error) {
      next(createError(500, 'Batch processing failed'));
    }
  }

  static async getStatus(req, res, next) {
    try {
      const workers = await WorkerService.getWorkerStatus();
      res.json({
        success: true,
        workers
      });
    } catch (error) {
      next(createError(500, 'Failed to get worker status'));
    }
  }
}

module.exports = WorkerController;