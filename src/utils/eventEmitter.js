const EventEmitter = require('events');
const { logger } = require('./logger');
const NotificationService = require('../services/notification.service');

class OrderEventEmitter extends EventEmitter {}
const eventEmitter = new OrderEventEmitter();

// Order created event
eventEmitter.on('orderCreated', (order) => {
  logger.info(`Order ${order.orderNumber} created`);
  NotificationService.sendOrderConfirmation(order);
});

// Order status changed event
eventEmitter.on('orderStatusChanged', ({ orderId, newStatus }) => {
  logger.info(`Order ${orderId} status changed to ${newStatus}`);
  NotificationService.sendStatusUpdate(orderId, newStatus);
});

// Inventory low event
eventEmitter.on('inventoryLow', (product) => {
  logger.info(`Low inventory for product ${product._id}`);
  NotificationService.sendInventoryAlert(product);
});

module.exports = { eventEmitter };