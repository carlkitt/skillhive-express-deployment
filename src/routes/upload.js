const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// destination folder inside backend/src/assets
const destDir = path.join(__dirname, '..', 'assets', 'images', 'mainpage_pictures');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, destDir);
  },
  filename: function (req, file, cb) {
    // prefer slug param if provided, else original filename (sanitized)
    const slug = (req.body && req.body.slug) ? req.body.slug : '';
    const base = slug ? slug.replace(/[^a-z0-9_-]/gi, '_') : path.parse(file.originalname).name.replace(/[^a-z0-9_-]/gi, '_');
    const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype === 'image/png' ? '.png' : '.jpg');
    cb(null, base + '_' + Date.now() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only jpg, jpeg and png files are allowed'));
  }
});

// POST /api/upload/category-image
router.post('/category-image', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // return the public path relative to /assets
    const publicPath = `/assets/images/mainpage_pictures/${req.file.filename}`;
    return res.json({ ok: true, url: publicPath });
  } catch (err) {
    console.error('Upload error:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;