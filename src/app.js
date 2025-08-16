// =======================
// Imports (node_modules)
// =======================
const express = require('express');
const cors = require('cors');

// =======================
// Environment Variables
// =======================
require('dotenv').config();

// =======================
// Environment Variables
// =======================
require('dotenv').config();

// =======================
// MySQL Pool Setup
// =======================
const { createPool } = require('./utils/mysqlQuery');
const pool = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// =======================
// Imports (local modules)
// =======================
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const shopRoutes = require('./routes/shop');
const userRoutes = require('./routes/user');
const pointsRoutes = require('./routes/points');
const paymongoRoutes = require('./routes/paymongo');
const inventoryRoutes = require('./routes/inventory');
const sessionsRoutes = require('./routes/sessions');
//const availableTimeRoutes = require('./availableTimeRoutes');
const feedbackRoutes = require('./routes/feedback');

// =======================
// App Setup
// =======================
const app = express();
app.use(cors());
app.use(express.json());

// =======================
// Routes
app.use('/api/sessions', sessionsRoutes);
app.use('/api/paymongo', paymongoRoutes);
app.use('/api/inventory', inventoryRoutes);
// =======================
app.use('/api', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/user', userRoutes);
app.use('/api/user', pointsRoutes);
//app.use('/api', availableTimeRoutes);
app.use('/api/feedback', feedbackRoutes);

// =======================
// Server Start
// =======================
app.listen(3000, () => console.log('Backend running on http://192.168.31.224:3000'));