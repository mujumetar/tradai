const express = require('express');
const router = express.Router();
const { getPublicTradeIdeas, getPublicTradeIdea } = require('../controllers/tradeApiController');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware');

// All routes require a valid API key in x-api-key header
router.use(apiKeyMiddleware);

router.get('/trade-ideas', getPublicTradeIdeas);
router.get('/trade-ideas/:id', getPublicTradeIdea);

module.exports = router;
