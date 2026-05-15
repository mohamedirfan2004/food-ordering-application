const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// @desc    Authenticate admin & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Only allow the configured admin username if provided
        if (process.env.ADMIN_USERNAME && username !== process.env.ADMIN_USERNAME) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Find admin by username
        const admin = await Admin.findOne({ username });
        
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Ensure JWT secret is configured
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not set for admin authentication');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                canPrint: admin.canPrint,
                printSettings: admin.printSettings
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get admin profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        res.json(admin);
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update print settings
// @route   PATCH /api/auth/print-settings
// @access  Private
exports.updatePrintSettings = async (req, res) => {
    try {
        const { canPrint, defaultFormat, footerText } = req.body;
        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        if (typeof canPrint === 'boolean') {
            admin.canPrint = canPrint;
        }
        if (!admin.printSettings) {
            admin.printSettings = {};
        }
        if (defaultFormat) {
            admin.printSettings.defaultFormat = defaultFormat;
        }
        if (typeof footerText === 'string') {
            admin.printSettings.footerText = footerText;
        }
        await admin.save();
        res.json({
            canPrint: admin.canPrint,
            printSettings: admin.printSettings
        });
    } catch (err) {
        console.error('Update print settings error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
