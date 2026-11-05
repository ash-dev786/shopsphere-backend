const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const protect = require('../middleware/authMiddleware');

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, phone, role, shopname } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const newUser = new User({
            name,
            email,
            password,
            phone,
            role,
            shopname
        });

        await newUser.save();

        res.status(201).json({ message: "User created successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Email not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        if (user.role === 'vendor' && user.status === 'Suspended') {
            return res.status(403).json({ message: "Your account is suspended by Admin." });
        }


        const token = jwt.sign(
            { id: user._id, role: user.role },
            "secret_key",
            { expiresIn: "1d" }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: "Login successful!",
            role: user.role,
            name: user.name
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: "Logged out successfully" });
});

// Get Profile Route
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Update Profile Route
router.put('/update-profile', protect, async (req, res) => {
    try {
        const { name, phone, shopname, city, address } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.name = name || user.name;
        user.phone = phone || user.phone;
        user.shopname = shopname || user.shopname;
        user.city = city || user.city;
        user.address = address || user.address;

        const updatedUser = await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                name: updatedUser.name,
                phone: updatedUser.phone,
                shopname: updatedUser.shopname,
                city: updatedUser.city,
                address: updatedUser.address
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;