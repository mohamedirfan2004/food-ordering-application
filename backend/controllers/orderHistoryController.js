const Order = require('../models/Order')

// @desc    Update order history state (printed / archived)
// @route   PUT /api/orders/:id/history
// @access  Private/Admin
exports.updateOrderHistory = async (req, res) => {
  try {
    const { action } = req.body || {}
    const now = new Date()

    const update = {}
    if (action === 'printed') {
      update.printedAt = now
      if (!update.movedToHistoryAt) {
        update.movedToHistoryAt = now
      }
    } else {
      // archive without printing
      update.movedToHistoryAt = now
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    )

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    res.json(order)
  } catch (err) {
    console.error('Error updating order history:', err)
    res.status(500).json({ message: 'Server error' })
  }
}
