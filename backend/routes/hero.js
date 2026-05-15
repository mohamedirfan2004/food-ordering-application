const express = require('express');
const router = express.Router();
const heroController = require('../controllers/heroController');
const auth = require('../middleware/auth');

// Public hero (Home page)
router.get('/public', heroController.getPublicHero);

// Admin hero management
router.get('/', auth, heroController.getHero);
router.put('/', auth, heroController.updateHero);

module.exports = router;
