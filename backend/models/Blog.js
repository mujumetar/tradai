const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    date: { type: String, default: () => new Date().toLocaleDateString() },
    category: { type: String, default: 'Finance' },
    isPremium: { type: Boolean, default: false },
    imageUrl: { type: String, default: "" }
}, { timestamps: true });

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;
