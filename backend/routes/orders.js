// routes/orders.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { updateOrderHistory } = require('../controllers/orderHistoryController');
const auth = require('../middleware/auth');

// Public routes
router.post('/', orderController.createOrder);
router.get('/track', orderController.trackOrders);

// Protected routes (require admin authentication)
router.get('/', auth, orderController.getOrders);
router.get('/:id', auth, orderController.getOrderById);
router.put('/:id/status', auth, orderController.updateOrderStatus);
router.put('/:id/merge', orderController.mergeItems); // Maps to the merge requirement
router.put('/:id/acknowledge', auth, orderController.acknowledgeNewItems);
router.put('/:id/history', auth, updateOrderHistory);

module.exports = router;