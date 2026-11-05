const Order = require('../models/Order');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const mongoose = require('mongoose');

const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        const currentSettings = await Settings.findOne() || { commissionRate: 5 };
        const vendorGroups = {};

        for (const item of items) {
            const product = await Product.findById(item.id);

            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.title}` });
            }

            const vendorId = product.vendor.toString();

            if (!vendorGroups[vendorId]) {
                vendorGroups[vendorId] = [];
            }

            vendorGroups[vendorId].push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                image: product.imageUrl,
                category: product.category
            });
        }

        const createdOrders = [];
        const shippingFee = 250;

        for (const vendorId in vendorGroups) {
            const vendorItems = vendorGroups[vendorId];
            const itemsTotal = vendorItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
            const vendorTotal = itemsTotal + shippingFee;

            const newOrder = new Order({
                customer: req.user.id,
                vendor: vendorId,
                items: vendorItems,
                shippingAddress,
                itemsTotal,
                shippingFee,
                vendorTotal,
                commissionRate: currentSettings.commissionRate
            });

            const savedOrder = await newOrder.save();
            createdOrders.push(savedOrder);
        }

        res.status(201).json({
            message: "Order placed successfully!",
            orders: createdOrders
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user.id })
            .populate('vendor', 'shopname name')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getVendorOrders = async (req, res) => {
    try {
        const orders = await Order.find({ vendor: req.user.id })
            .populate('customer', 'name phone')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.vendor.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized to update this order" });
        }

        if (status === 'Completed' && order.status !== 'Completed') {
            const currentSettings = await Settings.findOne() || { commissionRate: 5 };
            order.commissionRate = currentSettings.commissionRate;
        }

        order.status = status;
        order.isReadByCustomer = false; 
        await order.save();

        res.status(200).json({ message: "Order status updated successfully", order });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getVendorNotifications = async (req, res) => {
    try {
        const pendingOrders = await Order.find({ vendor: req.user.id, status: 'Pending' })
            .populate({
                path: 'customer',
                select: 'name',
                options: { strictPopulate: false }
            })
            .sort({ createdAt: -1 })
            .limit(5);

        const notifications = pendingOrders.map(order => ({
            _id: order._id,
            title: 'New Order Received',
            desc: `Order #${order._id.toString().slice(-6).toUpperCase()} placed by ${order.customer?.name || 'Customer'}`,
            time: order.createdAt,
            type: 'order',
            isRead: false
        }));

        res.status(200).json(notifications);
    } catch (error) {
        console.error("Notification Error:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getVendorDashboardStats = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const totalOrders = await Order.countDocuments({ vendor: vendorId });
        const activeProducts = await Product.countDocuments({ vendor: vendorId });

        const revenueResult = await Order.aggregate([
            { $match: { vendor: new mongoose.Types.ObjectId(vendorId), status: 'Completed' } },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $multiply: ['$vendorTotal', { $divide: [{ $subtract: [100, '$commissionRate'] }, 100] }] } }
                }
            }
        ]);

        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        const topProducts = await Order.aggregate([
            { $match: { vendor: new mongoose.Types.ObjectId(vendorId), status: 'Completed' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    name: { $first: '$items.name' },
                    image: { $first: '$items.image' },
                     category: { $first: '$items.category' }, 
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({
            totalOrders,
            activeProducts,
            totalRevenue,
            topProducts
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getCustomerNotifications = async (req, res) => {
    try {
        const unreadCount = await Order.countDocuments({
            customer: req.user.id,
            status: { $ne: 'Pending' },
            isReadByCustomer: false
        });

        res.status(200).json({ count: unreadCount });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const markCustomerOrdersAsRead = async (req, res) => {
    try {
        await Order.updateMany(
            { customer: req.user.id, isReadByCustomer: false },
            { $set: { isReadByCustomer: true } }
        );
        res.status(200).json({ message: "Orders marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getVendorOrders,
    updateOrderStatus,
    getVendorNotifications,
    getVendorDashboardStats,
    getCustomerNotifications,
    markCustomerOrdersAsRead,
};