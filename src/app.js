// =======================
// Imports (node_modules)
// =======================
const express = require('express');
const cors = require('cors');

// =======================
// Environment Variables
// =======================
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const port = process.env.DB_HOST_PORT || 3306;

// =======================
// MySQL Pool Setup
// =======================
const { createPool } = require('./utils/mysqlQuery');
const pool = createPool({
    host: process.env.DB_HOST || 'bjhvgr90ewlwfy7hvrrp-mysql.services.clever-cloud.com',
    user: process.env.DB_USER || 'umhwrkzsbn2bdp7p',
    password: process.env.DB_PASSWORD || '0EjHTPEKuIGD9jXtEPbK',
    database: process.env.DB_NAME || 'bjhvgr90ewlwfy7hvrrp',
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
app.listen(port, () => console.log(`Backend running on port ${port}`));