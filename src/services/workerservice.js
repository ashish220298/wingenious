const workerManager = require('../workers/worker.manager');
const { logger } = require('../utils/logger');

class WorkerService {
  static async generateDailyAnalytics() {
    try {
      logger.info('Starting daily analytics generation');
      const result = await workerManager.executeTask('analytics', {
        task: 'dailyReport'
      });
      logger.info('Daily analytics generated successfully');
      return result;
    } catch (error) {
      logger.error('Failed to generate daily analytics:', error);
      throw error;
    }
  }

  static async processBatchOrders(query, batchSize = 100) {
    try {
      logger.info('Starting batch order processing');
      const result = await workerManager.executeTask('batch', {
        task: 'updateOrderStatuses',
        query,
        batchSize
      });
      logger.info(`Processed ${result.processed} orders`);
      return result;
    } catch (error) {
      logger.error('Batch processing failed:', error);
      throw error;
    }
  }

  static async getWorkerStatus() {
    return workerManager.getActiveWorkers();
  }
}

module.exports = WorkerService;