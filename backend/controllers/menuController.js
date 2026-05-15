const FoodItem = require('../models/FoodItem');
const path = require('path');
const fs = require('fs');

const parseBooleanLike = (value, defaultValue) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const v = value.trim().toLowerCase();
        if (v === 'true') return true;
        if (v === 'false') return false;
    }
    if (typeof value === 'number') {
        if (value === 1) return true;
        if (value === 0) return false;
    }
    return defaultValue;
};

// @desc    Get all food items for customers
// @route   GET /api/menu
// @access  Public
// Note: we return all items and let the frontend decide how to display
// items that are currently unavailable (e.g. greyed out, disabled).
exports.getMenu = async (req, res) => {
    try {
        const items = await FoodItem.find({});
        res.json(items);
    } catch (err) {
        console.error('Error fetching menu:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all food items (admin)
// @route   GET /api/menu/all
// @access  Private/Admin
exports.getAllMenuItems = async (req, res) => {
    try {
        const items = await FoodItem.find({});
        res.json(items);
    } catch (err) {
        console.error('Error fetching all menu items:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a food item
// @route   POST /api/menu
// @access  Private/Admin
exports.createMenuItem = async (req, res) => {
    try {
        const { name, description, price, category, isAvailable, availabilityType, scheduleStart, scheduleEnd } = req.body;
        let image = '';

        if (req.file) {
            image = req.file.filename;
        }

        const newItem = new FoodItem({
            name,
            description,
            price,
            category,
            image,
            isAvailable: parseBooleanLike(isAvailable, true),
            availabilityType: availabilityType || 'always',
            scheduleStart: scheduleStart || undefined,
            scheduleEnd: scheduleEnd || undefined,
        });

        const item = await newItem.save();
        res.status(201).json(item);
    } catch (err) {
        console.error('Error creating menu item:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a food item
// @route   PUT /api/menu/:id
// @access  Private/Admin
exports.updateMenuItem = async (req, res) => {
    try {
        const { name, description, price, category, isAvailable, availabilityType, scheduleStart, scheduleEnd } = req.body;
        const updateFields = {
            name,
            description,
            price,
            category,
            isAvailable: parseBooleanLike(isAvailable, true),
            availabilityType,
            scheduleStart,
            scheduleEnd,
        };

        if (req.file) {
            // Delete old image if it exists and is not the default
            const oldItem = await FoodItem.findById(req.params.id);
            if (oldItem.image && oldItem.image !== 'default-food.jpg') {
                const imagePath = path.join(__dirname, '../uploads', oldItem.image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            updateFields.image = req.file.filename;
        }

        const item = await FoodItem.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.json(item);
    } catch (err) {
        console.error('Error updating menu item:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a food item
// @route   DELETE /api/menu/:id
// @access  Private/Admin
exports.deleteMenuItem = async (req, res) => {
    try {
        const item = await FoodItem.findById(req.params.id);
        
        if (!item) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Delete the associated image if it exists and is not the default
        if (item.image && item.image !== 'default-food.jpg') {
            const imagePath = path.join(__dirname, '../uploads', item.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        await FoodItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'Menu item removed' });
    } catch (err) {
        console.error('Error deleting menu item:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
