const Ticket = require('../models/Ticket');
const User = require('../models/User');

// ─── User actions ──────────────────────────────────────────────────────────

// @desc    Create a support ticket (any logged-in user)
exports.createTicket = async (req, res) => {
    const { subject, description, category, callbackRequested, callbackPhone } = req.body;
    const ticket = await Ticket.create({
        userId: req.user._id,
        subject, description,
        category: category || 'general',
        callbackRequested: !!callbackRequested,
        callbackPhone: callbackPhone || '',
        messages: [{
            sender: req.user._id,
            senderName: req.user.name,
            senderRole: req.user.role,
            body: description
        }]
    });

    req.io.emit('new_ticket', {
        id: ticket._id, subject, user: req.user.name,
        priority: ticket.priority, createdAt: ticket.createdAt
    });

    res.status(201).json({ message: 'Ticket created', ticket });
};

// @desc    Get tickets for logged-in user
exports.getMyTickets = async (req, res) => {
    const tickets = await Ticket.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .select('-messages');
    res.json(tickets);
};

// @desc    Get single ticket with full thread (user can only see own)
exports.getTicket = async (req, res) => {
    const query = req.user.role === 'user' ? { _id: req.params.id, userId: req.user._id } : { _id: req.params.id };
    const ticket = await Ticket.findOne(query)
        .populate('userId', 'name email subscription')
        .populate('assignedTo', 'name role')
        .populate('messages.sender', 'name role');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
};

// ─── Admin / Staff actions ─────────────────────────────────────────────────

// @desc    Get all tickets (admin, manager, support)
exports.getAllTickets = async (req, res) => {
    const { status, priority, category, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const tickets = await Ticket.find(filter)
        .populate('userId', 'name email')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .select('-messages');

    const total = await Ticket.countDocuments(filter);
    res.json({ tickets, total });
};

// @desc    Reply to a ticket (adds message to thread)
exports.replyToTicket = async (req, res) => {
    const { body } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.messages.push({
        sender: req.user._id,
        senderName: req.user.name,
        senderRole: req.user.role,
        body
    });

    // If first staff reply, move to in-progress
    if (ticket.status === 'open' && req.user.role !== 'user') {
        ticket.status = 'in-progress';
    }

    await ticket.save();

    req.io.emit('ticket_reply', {
        ticketId: ticket._id, from: req.user.name, role: req.user.role
    });

    res.json({ message: 'Reply added', ticket });
};

// @desc    Update ticket metadata (status, priority, assignee)
exports.updateTicket = async (req, res) => {
    const { status, priority, assignedTo } = req.body;
    const update = {};
    if (status) { update.status = status; if (status === 'resolved') update.resolvedAt = new Date(); }
    if (priority) update.priority = priority;
    if (assignedTo !== undefined) update.assignedTo = assignedTo || null;

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, update, { new: true })
        .populate('assignedTo', 'name role');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    req.io.emit('ticket_updated', { ticketId: ticket._id, status: ticket.status });
    res.json(ticket);
};

// @desc    Delete a ticket
exports.deleteTicket = async (req, res) => {
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ticket deleted' });
};

// @desc    Get ticket stats for analytics
exports.getTicketStats = async (req, res) => {
    const [open, inProgress, resolved, closed, callbacksPending] = await Promise.all([
        Ticket.countDocuments({ status: 'open' }),
        Ticket.countDocuments({ status: 'in-progress' }),
        Ticket.countDocuments({ status: 'resolved' }),
        Ticket.countDocuments({ status: 'closed' }),
        Ticket.countDocuments({ callbackRequested: true, status: { $in: ['open', 'in-progress'] } })
    ]);
    res.json({ open, inProgress, resolved, closed, callbacksPending });
};
