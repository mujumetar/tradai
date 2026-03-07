const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: String, required: true },
    html: { type: String, required: true },    // Body content (HTML for email, plain text/markdown for push)
    description: { type: String, default: '' },
    type: { type: String, enum: ['email', 'push'], default: 'email' }
}, { timestamps: true });

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);
module.exports = EmailTemplate;
