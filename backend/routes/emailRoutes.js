const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const roles = require('../middleware/roleMiddleware');
const { getTemplates, createTemplate, updateTemplate, deleteTemplate, sendBulkEmail, sendSingleEmail, previewTemplate, seedTemplates } = require('../controllers/emailController');

// All email actions require admin or manager
router.use(protect);
router.use(roles('admin', 'manager'));

router.get('/templates', getTemplates);
router.post('/templates/seed', seedTemplates);
router.post('/templates', createTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);
router.get('/templates/:id/preview', previewTemplate);

router.post('/send-bulk', sendBulkEmail);
router.post('/send-single', sendSingleEmail);

module.exports = router;
