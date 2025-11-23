const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
        trim: true
    },
    interval: {
        type: Number,
        default: 60, // seconds
        min: 10
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'down'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Agent', agentSchema);
