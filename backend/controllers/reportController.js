const Order = require('../models/Order');

// @desc    Get daily sales summary (today)
// @route   GET /api/reports/daily
// @access  Private/Admin
exports.getDailySales = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const result = await Order.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        res.json(result[0] || { totalSales: 0, orderCount: 0 });
    } catch (err) {
        console.error('Error fetching daily sales:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get monthly sales (per day of current month)
// @route   GET /api/reports/monthly
// @access  Private/Admin
exports.getMonthlySales = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const result = await Order.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    totalSales: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(result);
    } catch (err) {
        console.error('Error fetching monthly sales:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get top selling items
// @route   GET /api/reports/top-items
// @access  Private/Admin
exports.getTopSellingItems = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit || '5', 10);

        const result = await Order.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.foodItem',
                    name: { $first: '$items.name' },
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: limit }
        ]);

        res.json(result);
    } catch (err) {
        console.error('Error fetching top items:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
