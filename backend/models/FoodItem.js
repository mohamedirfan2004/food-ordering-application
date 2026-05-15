const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        default: 'default-food.jpg'
    },
    // Manual on/off flag controlled by admin
    isAvailable: {
        type: Boolean,
        default: true
    },
    // Time-based availability settings
    availabilityType: {
        type: String,
        enum: ['always', 'scheduled'],
        default: 'always'
    },
    // Stored as HH:MM (24h) in server's local time
    scheduleStart: {
        type: String
    },
    scheduleEnd: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('FoodItem', foodItemSchema);
