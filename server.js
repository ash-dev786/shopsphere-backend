require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const app = express();

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Database Connection
mongoose.connect("mongodb+srv://ashardeveloper45_db_user:ashar123@cluster0.f7ozwoz.mongodb.net/ecommerce?retryWrites=true&w=majority")
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch((err) => console.log('MongoDB Connection Failed:', err));

// Purane orders ko 5% par fix karne ka code
mongoose.connection.once('open', async () => {
    const Order = require('./models/Order');
    await Order.updateMany(
        { commissionRate: { $exists: false } },
        { $set: { commissionRate: 5 } }
    );
    console.log("Old orders fixed with 5% commission rate.");
});

// Test route
app.get('/', (req, res) => {
    res.send("Backend Server is running perfectly!");
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Server start
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});