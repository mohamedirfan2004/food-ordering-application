const express = require('express');
const router = express.Router();
const Footer = require('../models/Footer');
const auth = require('../middleware/auth'); // Admin auth middleware

const getFooter = async () => {
    let footer = await Footer.findOne();
    if (!footer) {
        footer = new Footer({
            address: '123 Main St, City, Country',
            phone: '+1 234 567 8900',
            email: 'hello@nanban.com',
            instagramLink: 'https://instagram.com/nanban',
            facebookLink: 'https://facebook.com/nanban',
            copyrightText: '© 2026 Nanban Restaurant. All rights reserved.'
        });
        await footer.save();
    }
    return footer;
};

// GET /api/footer (Public)
router.get('/', async (req, res) => {
    try {
        const footer = await getFooter();
        res.json(footer);
    } catch (err) {
        console.error('Error fetching footer:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/footer (Admin only)
router.put('/', auth, async (req, res) => {
    try {
        const updates = req.body;
        let footer = await getFooter();
        
        Object.keys(updates).forEach(key => {
            if (footer[key] !== undefined) {
                footer[key] = updates[key];
            }
        });

        await footer.save();
        res.json(footer);
    } catch (err) {
        console.error('Error updating footer:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
