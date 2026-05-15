const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  isGeofencingEnabled: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
