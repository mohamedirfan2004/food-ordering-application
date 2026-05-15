const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Nanban Restaurant',
    trim: true,
  },
  subtitle: {
    type: String,
    default: "Taste Nagercoil's favourites, delivered to you.",
    trim: true,
  },
  badge1: {
    type: String,
    default: 'Curated South Indian Specials',
    trim: true,
  },
  badge2: {
    type: String,
    default: 'Live order tracking',
    trim: true,
  },
  badge3: {
    type: String,
    default: 'Dine-in & Takeaway',
    trim: true,
  },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop',
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Hero', heroSchema);
