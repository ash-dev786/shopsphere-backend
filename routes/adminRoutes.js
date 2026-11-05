const express = require('express');
const router = express.Router();
const {
    getAdminNotifications,
    markAdminNotificationsRead,
    getAllVendors,
    toggleVendorStatus,
    getAdminCommissions,
    getAdminSettings,
    updateAdminSettings,
    getAdminDashboardStats
} = require('../controllers/adminController');

router.get('/admin-stats', getAdminDashboardStats); 
router.get('/notifications', getAdminNotifications);
router.put('/mark-read', markAdminNotificationsRead);
router.get('/vendors', getAllVendors);
router.put('/vendors/:id/toggle-status', toggleVendorStatus);
router.get('/commissions', getAdminCommissions);
router.get('/settings', getAdminSettings);
router.put('/settings', updateAdminSettings);

module.exports = router;