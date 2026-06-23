const mongoose = require('mongoose');

const footerSchema = new mongoose.Schema({
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  instagramLink: { type: String, default: '' },
  facebookLink: { type: String, default: '' },
  copyrightText: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Footer', footerSchema);
