const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const {
    getBlogs, getAcademy, getTradeIdeas,
    createBlog, updateBlog, deleteBlog,
    createTradeIdea, updateTradeIdea, deleteTradeIdea, closeTradeIdea, getLivePrice, searchTickers
} = require('../controllers/contentController');
const { protect, admin } = require('../middleware/authMiddleware');
const roles = require('../middleware/roleMiddleware');

// Public / Optional-auth routes
router.get('/blogs', getBlogs);
router.get('/academy', getAcademy);
router.get('/trade-ideas', getTradeIdeas);
router.get('/trade-ideas/live-price', getLivePrice);
router.get('/trade-ideas/search-tickers', searchTickers);

// Admin Content routes - allowing manager role too
router.use(protect);
router.use(roles('admin', 'manager'));

router.post('/blogs', upload.single('image'), createBlog);
router.put('/blogs/:id', upload.single('image'), updateBlog);
router.delete('/blogs/:id', deleteBlog);

router.post('/trade-ideas', createTradeIdea);
router.put('/trade-ideas/:id', updateTradeIdea);
router.delete('/trade-ideas/:id', deleteTradeIdea);

module.exports = router;
