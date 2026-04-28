const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
    uploadLeads, 
    getAgentLeads, 
    markAsTricked, 
    sendWhatsAppMessage 
} = require('../controllers/leadController');
const { protect, agent } = require('../middleware/authMiddleware');

const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.post('/upload', protect, agent, upload.single('file'), uploadLeads);
router.get('/', protect, agent, getAgentLeads);
router.post('/trick', protect, agent, markAsTricked);
router.post('/send-whatsapp', protect, agent, sendWhatsAppMessage);

module.exports = router;
