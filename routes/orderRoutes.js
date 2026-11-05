const express = require('express');
const router = express.Router();
const { 
    createOrder, 
    getMyOrders, 
    getVendorOrders, 
    updateOrderStatus, 
    getVendorNotifications, 
    getVendorDashboardStats, 
    getCustomerNotifications,
    markCustomerOrdersAsRead
} = require('../controllers/orderController');
const protect = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/vendor', protect, getVendorOrders);
router.put('/:id/status', protect, updateOrderStatus);
router.get('/notifications', protect, getVendorNotifications);
router.get('/dashboard-stats', protect, getVendorDashboardStats);
router.get('/customer-notifications', protect, getCustomerNotifications);
router.put('/mark-read', protect, markCustomerOrdersAsRead);

module.exports = router;