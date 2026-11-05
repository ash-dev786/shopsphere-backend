const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            image: { type: String, required: true },
            category: { type: String, default: 'N/A' },
        }
    ],
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        altPhone: { type: String },
        city: { type: String, required: true },
        address: { type: String, required: true }
    },
    itemsTotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true },
    vendorTotal: { type: Number, required: true },
    paymentMethod: { type: String, default: 'COD' },
    status: { type: String, default: 'Pending' },
    isReadByCustomer: { type: Boolean, default: false },
    commissionRate: { type: Number, required: true }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;