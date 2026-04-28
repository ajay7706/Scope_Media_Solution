const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['city', 'village'],
        required: true
    },
    status: {
        type: String,
        enum: ['new', 'tricked'],
        default: 'new'
    },
    agent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Lead = mongoose.model('Lead', leadSchema);
module.exports = Lead;
