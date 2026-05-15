const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Reports (all protected)
router.get('/daily', auth, reportController.getDailySales);
router.get('/monthly', auth, reportController.getMonthlySales);
router.get('/top-items', auth, reportController.getTopSellingItems);

module.exports = router;
