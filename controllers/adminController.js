const Settings = require('../models/Settings');
const User = require('../models/User');
const Order = require('../models/Order');

const getAdminNotifications = async (req, res) => {
    try {

        const newVendors = await User.find({ role: 'vendor', isReadByAdmin: false })
            .sort({ createdAt: -1 })
            .limit(3);

        const vendorNotifications = newVendors.map(vendor => ({
            _id: vendor._id,
            title: 'New Vendor Registered',
            desc: `${vendor.shopname || vendor.name} submitted details`,
            time: vendor.createdAt,
            type: 'user',
            isRead: false
        }));


        const completedOrders = await Order.find({ status: 'Completed', isReadByAdmin: false })
            .sort({ updatedAt: -1 })
            .limit(3);

        const orderNotifications = completedOrders.map(order => ({
            _id: order._id,
            title: 'Commission Earned',
            desc: `Rs ${(order.vendorTotal * (order.commissionRate / 100)).toLocaleString()} (${order.commissionRate}%) deducted from Order #${order._id.toString().slice(-6).toUpperCase()}`,
            time: order.updatedAt,
            type: 'order',
            isRead: false
        }));


        const allNotifications = [...vendorNotifications, ...orderNotifications].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

        res.status(200).json(allNotifications);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const markAdminNotificationsRead = async (req, res) => {
    try {
        await User.updateMany(
            { role: 'vendor', isReadByAdmin: false },
            { $set: { isReadByAdmin: true } }
        );
        await Order.updateMany(
            { isReadByAdmin: false },
            { $set: { isReadByAdmin: true } }
        );
        res.status(200).json({ message: "Notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getAllVendors = async (req, res) => {
    try {
        const vendors = await User.find({ role: 'vendor' }).select('-password');
        const vendorsWithStats = await Promise.all(vendors.map(async (vendor) => {
            const orders = await Order.find({ vendor: vendor._id, status: 'Completed' });
            const totalSales = orders.reduce((acc, order) => {
                return acc + order.items.reduce((sum, item) => sum + item.quantity, 0);
            }, 0);

            const totalRevenue = orders.reduce((acc, order) => acc + order.vendorTotal, 0);

            return {
                _id: vendor._id,
                shopname: vendor.shopname,
                name: vendor.name,
                email: vendor.email,
                status: vendor.status || 'Active',
                sales: totalSales,
                revenue: totalRevenue
            };
        }));

        res.status(200).json(vendorsWithStats);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const toggleVendorStatus = async (req, res) => {
    try {
        const vendor = await User.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        vendor.status = vendor.status === 'Suspended' ? 'Active' : 'Suspended';
        await vendor.save();

        res.status(200).json({ message: `Vendor ${vendor.status}`, status: vendor.status });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getAdminDashboardStats = async (req, res) => {
    try {
        const completedOrders = await Order.find({ status: 'Completed' });

        let totalRevenue = 0;
        let totalCommission = 0;

        completedOrders.forEach(order => {
            totalRevenue += order.vendorTotal;
            totalCommission += order.vendorTotal * (order.commissionRate / 100);
        });

        const activeVendors = await User.countDocuments({ role: 'vendor' });

        const recentOrders = await Order.find({ status: 'Completed' })
            .populate('vendor', 'shopname')
            .sort({ updatedAt: -1 })
            .limit(5);

        const recentCommissions = recentOrders.map(order => {
            const rate = order.commissionRate;
            return {
                id: `TXN-${order._id.toString().slice(-4).toUpperCase()}`,
                vendor: order.vendor?.shopname || 'Unknown Vendor',
                order: `ORD-${order._id.toString().slice(-5).toUpperCase()}`,
                saleAmount: `Rs ${order.vendorTotal.toLocaleString()}`,
                commission: `Rs ${(order.vendorTotal * (rate / 100)).toLocaleString()} (${rate}%)`,
                time: order.updatedAt
            };
        });

        res.status(200).json({
            totalRevenue,
            totalCommission,
            activeVendors,
            recentCommissions
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getAdminCommissions = async (req, res) => {
    try {
        const completedOrders = await Order.find({ status: 'Completed' })
            .populate('vendor', 'shopname')
            .sort({ updatedAt: -1 });

        let totalCommission = 0;

        const records = completedOrders.map(order => {
            const rate = order.commissionRate;
            const comm = order.vendorTotal * (rate / 100);
            totalCommission += comm;

            return {
                _id: order._id,
                vendor: order.vendor?.shopname || 'Unknown',
                orderId: order._id.toString().slice(-6).toUpperCase(),
                totalAmount: order.vendorTotal,
                commission: comm,
                date: order.updatedAt,
                commissionRate: rate
            };
        });

        res.status(200).json({ records, totalCommission });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getAdminSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({ commissionRate: 5 });
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateAdminSettings = async (req, res) => {
    try {
        const { commissionRate } = req.body;
        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings({ commissionRate });
        } else {
            settings.commissionRate = commissionRate;
        }

        await settings.save();
        res.status(200).json({ message: "Settings updated", settings });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    getAdminNotifications,
    markAdminNotificationsRead,
    getAllVendors,
    toggleVendorStatus,
    getAdminCommissions,
    getAdminSettings,
    updateAdminSettings,
    getAdminDashboardStats
};