const Order = require('./models/Order');
const Product = require('./models/Product');
const User = require('./models/User');
const Analytics = require('../models/Analytics');
const { cache } = require('./cache.service');
const { worker } = require('../workers/analytics.worker');
const { logger } = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this.cachePrefix = 'analytics:';
  }

  // Real-time Dashboard Metrics
  async getRealTimeDashboard() {
    const cacheKey = `${this.cachePrefix}dashboard`;
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const [revenue, orders, products, customers] = await Promise.all([
      this._getCurrentRevenue(),
      this._getRecentOrders(24), // Last 24 hours
      this._getTopProducts(5),
      this._getNewCustomers(7) // Last 7 days
    ]);

    const data = {
      revenue,
      orders,
      products,
      customers,
      updatedAt: new Date()
    };

    await cache.set(cacheKey, JSON.stringify(data), 'EX', 300); // Cache for 5 minutes
    return data;
  }

  // Revenue Analytics
  async getRevenueTrends(range = '30d') {
    const cacheKey = `${this.cachePrefix}revenue:${range}`;
    const cachedData = await cache.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    let days;
    switch (range) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      default: days = 30;
    }

    const data = await this._calculateRevenueTrend(days);
    await cache.set(cacheKey, JSON.stringify(data), 'EX', 3600); // Cache for 1 hour
    return data;
  }

  // Customer Segmentation
  async getCustomerSegments() {
    return Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // 90 days
        }
      },
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      {
        $bucket: {
          groupBy: '$totalSpent',
          boundaries: [0, 100, 500, 1000, 5000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            totalRevenue: { $sum: '$totalSpent' },
            avgOrders: { $avg: '$orderCount' }
          }
        }
      }
    ]);
  }

  // Product Performance
  async getProductPerformance(limit = 10) {
    return Order.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit }
    ]);
  }

  // Inventory Analytics
  async getInventoryAnalysis() {
    return Product.aggregate([
      {
        $project: {
          name: 1,
          category: 1,
          stock: '$inventory.stock',
          status: {
            $cond: {
              if: { $lte: ['$inventory.stock', 0] },
              then: 'out_of_stock',
              else: {
                $cond: {
                  if: { $lte: ['$inventory.stock', '$inventory.lowStockThreshold'] },
                  then: 'low_stock',
                  else: 'in_stock'
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          products: { $push: '$name' }
        }
      }
    ]);
  }

  // Precompute all analytics (for background worker)
  async precomputeAllAnalytics() {
    try {
      const [dashboard, revenueTrends, customerSegments, productPerformance] = await Promise.all([
        this.getRealTimeDashboard(),
        this.getRevenueTrends('30d'),
        this.getCustomerSegments(),
        this.getProductPerformance()
      ]);

      const analyticsRecord = new Analytics({
        type: 'full',
        data: {
          dashboard,
          revenueTrends,
          customerSegments,
          productPerformance
        },
        computedAt: new Date()
      });

      await analyticsRecord.save();
      return analyticsRecord;
    } catch (error) {
      logger.error('Failed to precompute analytics:', error);
      throw error;
    }
  }

  // Private Methods
  async _getCurrentRevenue() {
    const result = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    return result[0]?.total || 0;
  }

  async _getRecentOrders(hours) {
    return Order.countDocuments({
      status: 'completed',
      createdAt: { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) }
    });
  }

  async _getTopProducts(limit) {
    const products = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          sold: { $sum: '$items.quantity' }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: limit }
    ]);
    return products;
  }

  async _getNewCustomers(days) {
    return User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    });
  }

  async _calculateRevenueTrend(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: date }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }
}

module.exports = new AnalyticsService();