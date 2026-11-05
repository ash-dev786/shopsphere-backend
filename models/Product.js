const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true, // ImageKit se jo URL milega wo yahan save hoga
    },
    imageFileId: {
        type: String,
        required: true, // ImageKit ki file ID (Delete karte waqt kaam aayegi)
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Ye User model se connect hoga
        required: true,
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;