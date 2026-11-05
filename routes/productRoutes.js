const express = require('express');
const router = express.Router();
const { addProduct, getVendorProducts, deleteProduct, updateProduct, getAllProducts } = require('../controllers/productController');
const protect = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Vendor Routes
router.post('/add', protect, upload.single('image'), addProduct);
router.get('/vendor', protect, getVendorProducts);
router.delete('/:id', protect, deleteProduct);
router.put('/:id', protect, upload.single('image'), updateProduct);


router.get('/', getAllProducts);

module.exports = router;