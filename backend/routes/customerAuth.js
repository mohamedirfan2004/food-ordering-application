const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Format phone number to E.164 format
const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // If number starts with 0, replace with country code
  if (cleaned.startsWith('0')) {
    return `+91${cleaned.substring(1)}`;
  }
  // If number starts with country code, ensure it has +
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  // If number is 10 digits, assume it's Indian number
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  // Return as is (should be in E.164 format)
  return `+${cleaned}`;
};

// Send OTP (disabled – now just ensures a customer record exists and is verified)
router.post('/send-otp', async (req, res) => {
  try {
    let { phone, name } = req.body;

    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    // Format phone number
    phone = formatPhoneNumber(phone);

    // Ensure customer exists and is marked verified (no real OTP flow)
    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = new Customer({ 
        phone,
        isVerified: true,
        name: name || undefined
      });
    } else {
      customer.isVerified = true;
      if (name && !customer.name) {
        customer.name = name;
      }
    }
    await customer.save();

    return res.json({ 
      success: true, 
      message: 'OTP verification is disabled. Phone registered successfully.',
      customer: {
        id: customer._id,
        phone: customer.phone,
        isVerified: customer.isVerified
      }
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to process request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify OTP (disabled – simply marks the customer as verified without checking any code)
router.post('/verify-otp', async (req, res) => {
  try {
    let { phone, name } = req.body;

    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    // Format phone number
    phone = formatPhoneNumber(phone);

    // Update or create customer as verified
    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = new Customer({ 
        phone,
        isVerified: true,
        name: name || undefined
      });
    } else {
      customer.isVerified = true;
      if (name && !customer.name) {
        customer.name = name;
      }
    }
    await customer.save();

    // Generate JWT token (kept for potential future use)
    const token = generateToken(customer._id);

    return res.json({ 
      success: true, 
      message: 'Phone verified (OTP disabled).',
      token,
      customer: {
        id: customer._id,
        phone: customer.phone,
        isVerified: customer.isVerified
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to verify phone. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;