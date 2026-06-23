const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/categoryController');

// Public
router.get('/', ctrl.listPublic);

// Admin
router.get('/all', auth, ctrl.listAll);
router.post('/', auth, ctrl.create);
router.patch('/:id/status', auth, ctrl.toggleActive);
router.put('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
