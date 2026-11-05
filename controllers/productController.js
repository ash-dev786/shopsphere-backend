const Product = require('../models/Product');
const imagekit = require('../config/imagekit');

// 1. Add Product Function
const addProduct = async (req, res) => {
    try {
        const { name, price, category, stock, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Product image is required" });
        }

        const uploadResponse = await imagekit.files.upload({
            file: req.file.buffer.toString('base64'),
            fileName: `product_${Date.now()}`,
            folder: "/products"
        });

        const newProduct = new Product({
            name,
            price,
            category,
            stock,
            description,
            imageUrl: uploadResponse.url,
            imageFileId: uploadResponse.fileId,
            vendor: req.user.id
        });

        await newProduct.save();

        res.status(201).json({ message: "Product added successfully!", product: newProduct });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// 2. Get Vendor Products 
const getVendorProducts = async (req, res) => {
    try {
        const products = await Product.find({ vendor: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};




// Delete Product Function
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);


        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }


        if (product.vendor.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized to delete this product" });
        }


        await imagekit.files.delete(product.imageFileId);


        await product.deleteOne();

        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update Product Function
const updateProduct = async (req, res) => {
    try {
        const { name, price, category, stock, description } = req.body;
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.vendor.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized to update this product" });
        }

        let imageUrl = product.imageUrl;
        let imageFileId = product.imageFileId;


        if (req.file) {

            await imagekit.files.delete(product.imageFileId);


            const uploadResponse = await imagekit.files.upload({
                file: req.file.buffer.toString('base64'),
                fileName: `product_${Date.now()}`,
                folder: "/products"
            });
            imageUrl = uploadResponse.url;
            imageFileId = uploadResponse.fileId;
        }

        // Update fields
        product.name = name || product.name;
        product.price = price || product.price;
        product.category = category || product.category;
        product.stock = stock || product.stock;
        product.description = description || product.description;
        product.imageUrl = imageUrl;
        product.imageFileId = imageFileId;

        const updatedProduct = await product.save();

        res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// Get All Products (For User Side with Pagination & Category Filter , searching..)
const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const category = req.query.category;
        const search = req.query.search;

        const User = require('../models/User');
        const suspendedVendors = await User.find({ role: 'vendor', status: 'Suspended' }).select('_id');
        const suspendedIds = suspendedVendors.map(v => v._id);

        let query = {};

        // suspended accounts
        if (suspendedIds.length > 0) {
            query.vendor = { $nin: suspendedIds };
        }

        if (category && category !== 'all') {
            query.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('vendor', 'name shopname')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            products,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { addProduct, getVendorProducts, deleteProduct, updateProduct, getAllProducts };



