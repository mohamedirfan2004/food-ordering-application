// models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  foodItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodItem',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  name: String,
  image: String,
  isNewItem: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: false,
    trim: true
  },
  table: {
    type: String,
    default: ''
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'completed', 'cancelled'],
    default: 'pending'
  },
  orderNumber: {
    type: String,
    unique: true
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  printedAt: {
    type: Date
  },
  movedToHistoryAt: {
    type: Date,
    expires: 604800 // Automatically delete 7 days (604800 seconds) after being moved to history
  }
}, { timestamps: true });

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD-' + Date.now().toString().slice(-8);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);