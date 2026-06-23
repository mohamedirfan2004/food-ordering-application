const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const auth = require('../middleware/auth');

// Multer removed in favor of direct image URL strings

// Public routes
router.get('/', menuController.getMenu);

// Protected routes (require admin authentication)
router.get('/all', auth, menuController.getAllMenuItems);
router.post('/', auth, menuController.createMenuItem);
router.put('/:id', auth, menuController.updateMenuItem);
router.delete('/:id', auth, menuController.deleteMenuItem);

module.exports = router;
