const mongoose = require('mongoose');

const noteschema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    content: { type: String, required: true },
    attachments: [{
        type: { type: String, enum: ['file', 'image', 'link'] },
        url: String
    }],
    shared: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        permission: { type: String, enum: ['read', 'write'] }
    }]
}, { timestamps: true });
module.exports = mongoose.model('Note', noteschema);