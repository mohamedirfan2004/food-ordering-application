const Customer = require('../models/Customer')

// @desc    Get all customers with their order history
// @route   GET /api/customers
// @access  Private/Admin
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .sort({ createdAt: -1 })
      .populate({ path: 'orders', options: { sort: { createdAt: -1 } } })

    res.json(customers)
  } catch (err) {
    console.error('Error fetching customers:', err)
    res.status(500).json({ message: 'Server error' })
  }
}
