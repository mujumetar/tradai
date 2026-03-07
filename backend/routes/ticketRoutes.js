const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const roles = require('../middleware/roleMiddleware');
const { createTicket, getMyTickets, getAllTickets, getTicket, replyToTicket, updateTicket, deleteTicket, getTicketStats } = require('../controllers/ticketController');

router.use(protect);

// User routes
router.post('/', createTicket);
router.get('/my', getMyTickets);

// Shared specific ticket view/reply (staff and ticket owner)
router.get('/:id', getTicket);
router.post('/:id/reply', replyToTicket);

// Admin/Staff routes
router.get('/', roles('admin', 'manager', 'support'), getAllTickets);
router.get('/stats/summary', roles('admin', 'manager', 'support'), getTicketStats);
router.put('/:id', roles('admin', 'manager', 'support'), updateTicket);
router.delete('/:id', roles('admin'), deleteTicket); // Only full admin deletes tickets

module.exports = router;
