const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { validateCreateOrder } = require('../utils/validators');

router.post('/',
  authenticate,
  validateCreateOrder,
  asyncHandler(orderController.createOrder)
);

router.get('/',
  authenticate,
  asyncHandler(orderController.listOrders)
);

router.get('/:id',
  authenticate,
  asyncHandler(orderController.getOrder)
);

router.put('/:id/status',
  authenticate,
  asyncHandler(orderController.updateOrderStatus)
);

router.get('/:id/timeline',
  authenticate,
  asyncHandler(orderController.getOrderTimeline)
);

module.exports = router;