const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    shopname: {
        type: String,
    },
    city: {
        type: String,
    },
    address: {
        type: String,
    },

    status: {
        type: String,
        default: 'Active'
    },
    isReadByAdmin: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;