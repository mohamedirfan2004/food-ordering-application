// routes/customers.js
const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const customerController = require('../controllers/customerController')

// Admin-only: list customers
router.get('/', auth, customerController.getCustomers)

module.exports = router
