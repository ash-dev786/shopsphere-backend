const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    commissionRate: { 
        type: Number, 
        default: 5 
    }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;