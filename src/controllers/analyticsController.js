const AnalyticsService = require('../services/analytics.service');
const { createError } = require('../utils/errorHandler');

class AnalyticsController {
  async getDashboardMetrics(req, res, next) {
    try {
      const metrics = await AnalyticsService.getRealTimeDashboard();
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(createError(500, 'Failed to fetch dashboard metrics'));
    }
  }

  async getRevenueTrends(req, res, next) {
    try {
      const { days = 30 } = req.query;
      const trends = await AnalyticsService.getRevenueTrends(days);
      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      next(createError(500, 'Failed to fetch revenue trends'));
    }
  }

  async getCustomerSegments(req, res, next) {
    try {
      const segments = await AnalyticsService.getCustomerSegments();
      res.json({
        success: true,
        data: segments
      });
    } catch (error) {
      next(createError(500, 'Failed to fetch customer segments'));
    }
  }

  async getProductPerformance(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const products = await AnalyticsService.getTopProducts(limit);
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(createError(500, 'Failed to fetch product performance'));
    }
  }
}

module.exports = new AnalyticsController();