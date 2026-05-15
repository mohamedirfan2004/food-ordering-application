const Category = require('../models/Category');

// Public: list active categories sorted by order then name
exports.listPublic = async (req, res) => {
  try {
    const cats = await Category.find({ active: true }).sort({ order: 1, name: 1 });
    res.json(cats);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: list all categories
exports.listAll = async (req, res) => {
  try {
    const cats = await Category.find({}).sort({ order: 1, name: 1 });
    res.json(cats);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: create category
exports.create = async (req, res) => {
  try {
    let { name, key, order, active, description } = req.body;
    const image = req.file ? req.file.filename : '';

    const activeSource = typeof active !== 'undefined' ? active : req.body.isActive;
    if (typeof activeSource === 'undefined' || activeSource === null || activeSource === '') {
      active = true;
    } else {
      active = activeSource === 'true' || activeSource === true;
    }

    if (!key && name) {
      key = name.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
    }

    if (order === undefined || order === null || order === '') {
      const last = await Category.findOne({}).sort({ order: -1 }).lean();
      order = ((last && typeof last.order === 'number') ? last.order : 0) + 1;
    }

    const cat = await Category.create({ name, key, order, active, image, description });
    res.status(201).json(cat);
  } catch (e) {
    console.error('Error creating category:', e);
    if (e && e.code === 11000) {
      const field = Object.keys(e.keyPattern || {})[0] || 'value';
      return res.status(400).json({ message: `Category ${field} must be unique` });
    }
    res.status(400).json({ message: e.message || 'Create failed' });
  }
};

// Admin: update category
exports.update = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(updates, 'isActive')) {
      updates.active = updates.isActive === 'true' || updates.isActive === true;
      delete updates.isActive;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'active')) {
      updates.active = updates.active === 'true' || updates.active === true;
    }

    if (req.file) updates.image = req.file.filename;
    const cat = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!cat) return res.status(404).json({ message: 'Not found' });
    res.json(cat);
  } catch (e) {
    res.status(400).json({ message: e.message || 'Update failed' });
  }
};

// Admin: toggle active status
exports.toggleActive = async (req, res) => {
  try {
    const source = req.body.active;
    const active = source === 'true' || source === true;
    const cat = await Category.findByIdAndUpdate(
      req.params.id,
      { active },
      { new: true }
    );
    if (!cat) return res.status(404).json({ message: 'Not found' });
    res.json(cat);
  } catch (e) {
    res.status(400).json({ message: e.message || 'Update failed' });
  }
};

// Admin: delete category
exports.remove = async (req, res) => {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Delete failed' });
  }
};
