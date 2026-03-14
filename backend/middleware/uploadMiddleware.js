const multer = require('multer');
const path = require('path');

const isServerless = process.env.VERCEL === '1';

let storage;

if (isServerless) {
    // On Vercel the filesystem is read-only — use memory storage.
    // From memory (req.file.buffer) you can upload to Cloudinary / S3 / etc.
    storage = multer.memoryStorage();
} else {
    const fs = require('fs');
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadDir),
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
        },
    });
}

const fileFilter = (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files allowed'));
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter,
});

module.exports = upload;
