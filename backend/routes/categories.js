const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/categoryController');

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'cat-' + unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const ok = /jpe?g|png|webp/.test(path.extname(file.originalname).toLowerCase()) && /image\//.test(file.mimetype);
  ok ? cb(null, true) : cb(new Error('Images only!'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Public
router.get('/', ctrl.listPublic);

// Admin
router.get('/all', auth, ctrl.listAll);
router.post('/', auth, upload.single('image'), ctrl.create);
router.patch('/:id/status', auth, ctrl.toggleActive);
router.put('/:id', auth, upload.single('image'), ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
