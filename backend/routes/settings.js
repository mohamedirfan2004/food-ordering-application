const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const auth = require('../middleware/auth'); // Admin auth middleware

const getSettings = async () => {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = new Settings();
        await settings.save();
    }
    return settings;
};

// GET /api/settings (Public - used by GeofenceGuard to bypass or enforce)
router.get('/', async (req, res) => {
    try {
        const settings = await getSettings();
        res.json(settings);
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/settings/geofence (Admin only - toggle the status)
router.put('/geofence', auth, async (req, res) => {
    try {
        const { isGeofencingEnabled } = req.body;
        const settings = await getSettings();
        if (typeof isGeofencingEnabled === 'boolean') {
            settings.isGeofencingEnabled = isGeofencingEnabled;
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
