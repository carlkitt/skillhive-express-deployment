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
// MySQL Pool Setup
// =======================
const { createPool } = require('./utils/mysqlQuery');
const pool = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

// =======================
// Imports (local modules)
// =======================
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const shopRoutes = require('./routes/shop');
const userRoutes = require('./routes/user');
const pointsRoutes = require('./routes/points');
const messageRoutes = require('./routes/message');
const paymongoRoutes = require('./routes/paymongo');
const inventoryRoutes = require('./routes/inventory');
const tutorsRoutes = require('./routes/tutors');
const sessionsRoutes = require('./routes/sessions');
const registrationsRoutes = require('./routes/registrations');
const conversationRoutes = require('./routes/conversation');
const availableTimeRoutes = require('./routes/availableTimeRoutes');
const bookingsRoutes = require('./routes/bookings');
const feedbackRoutes = require('./routes/feedback');
const featuredTutorsRoutes = require('./routes/featured_tutors');
const leaderboardRoutes = require('./routes/leaderboard');
const tutorBookingsRoutes = require('./routes/tutor_bookings');
const notificationsRoutes = require('./routes/notifications');
const categoriesRoutes = require('./routes/categories');
const recommendedCategoriesRoutes = require('./routes/recommended_categories');
const sessionRoutes = require('./routes/session');

// =======================
// App Setup
// =======================
const app = express();
app.use(cors());
app.use(express.json());

// Serve static assets (images, uploads) from the repository assets/ folder
// Frontend may call e.g. http://<backend>/assets/images/skillhive_logo.png
const path = require('path');
// Serve from backend/src/assets if present, otherwise fall back to repo root assets/
const backendAssets = path.join(__dirname, 'assets');
const repoAssets = path.join(__dirname, '..', '..', 'assets');
if (require('fs').existsSync(backendAssets)) {
    app.use('/assets', express.static(backendAssets));
} else {
    app.use('/assets', express.static(repoAssets));
}

// Ensure logs directory exists and add a simple request logger that writes
// each incoming request to a file so we can inspect requests that triggered
// server errors even if console output was missed.
const fs = require('fs');
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
app.use((req, res, next) => {
    try {
        const entry = `${new Date().toISOString()} ${req.method} ${req.originalUrl} FROM ${req.ip}\n`;
        fs.appendFileSync(path.join(logsDir, 'requests.log'), entry);
    } catch (e) {
        console.error('Failed to write request log', e && e.message ? e.message : e);
    }
    next();
});

// =======================
// Routes
function mountRoute(basePath, routeModuleOrPath, name) {
    // If a string path is provided, require it lazily
    let routeModule = routeModuleOrPath;
    try {
        if (typeof routeModuleOrPath === 'string') {
            routeModule = require(routeModuleOrPath);
        }
    } catch (e) {
        console.error(`Failed to require route ${name} at ${routeModuleOrPath}:`, e && e.message ? e.message : e);
        throw e;
    }

    if (!routeModule) {
        console.error(`No module provided for route ${name} at ${basePath}`);
        throw new TypeError(`Missing route module for ${name}`);
    }
    // Support CommonJS default export shape { default: router }
    let routerToUse = routeModule;
    if (routerToUse && routerToUse.default) routerToUse = routerToUse.default;

    const isRouterLike = typeof routerToUse === 'function' || (routerToUse && (Array.isArray(routerToUse.stack) || typeof routerToUse.handle === 'function'));
    if (!isRouterLike) {
        console.error(`Invalid router for ${name} at ${basePath}. Type:`, typeof routerToUse, 'Value:', routerToUse);
        throw new TypeError(`Router.use() requires a middleware/router function but got ${typeof routerToUse} for ${name}`);
    }
    app.use(basePath, routerToUse);
    console.log(`Mounted route ${name} -> ${basePath}`);
}

// Mount routes lazily to avoid circular require issues
mountRoute('/api/sessions', './routes/sessions', 'sessionsRoutes');
mountRoute('/api/registrations', './routes/registrations', 'registrationsRoutes');
mountRoute('/api/paymongo', './routes/paymongo', 'paymongoRoutes');
mountRoute('/api/inventory', './routes/inventory', 'inventoryRoutes');
mountRoute('/api/tutors', './routes/tutors', 'tutorsRoutes');
mountRoute('/api/leaderboard', './routes/leaderboard', 'leaderboardRoutes');
// =======================
mountRoute('/api', './routes/auth', 'authRoutes');
mountRoute('/api', './routes/protected', 'protectedRoutes');
mountRoute('/api/shop', './routes/shop', 'shopRoutes');
mountRoute('/api/user', './routes/user', 'userRoutes');
mountRoute('/api/user', './routes/points', 'pointsRoutes');
//mountRoute('/api', availableTimeRoutes, 'availableTimeRoutes');
mountRoute('/api/feedback', './routes/feedback', 'feedbackRoutes');
mountRoute('/api/featured_tutors', './routes/featured_tutors', 'featuredTutorsRoutes');
mountRoute('/api/conversation', './routes/conversation', 'conversationRoutes');
mountRoute('/api/message', './routes/message', 'messageRoutes');
mountRoute('/api', './routes/availableTimeRoutes', 'availableTimeRoutes');
mountRoute('/api/categories', './routes/categories', 'categoriesRoutes');
mountRoute('/api/recommended_categories', './routes/recommended_categories', 'recommendedCategoriesRoutes');
mountRoute('/api/bookings', './routes/bookings', 'bookingsRoutes');
mountRoute('/api', './routes/tutor_bookings', 'tutorBookingsRoutes');
mountRoute('/api/notifications', './routes/notifications', 'notificationsRoutes');
mountRoute('/api/session', './routes/session', 'sessionRoutes');
// Uploads (images etc.) from admin/php or other services
mountRoute('/api/upload', './routes/upload', 'uploadRoutes');

// =======================
// Server Start (with WebSocket)
// =======================
const http = require('http');
const { setupWebSocket } = require('./ws');

const server = http.createServer(app);
// attach websocket (in-memory routing)
setupWebSocket(server);

// Ensure necessary conversation tables exist (useful when migrations haven't been run)
async function ensureConversationTables() {
    const { query, pool } = require('./utils/mysqlQuery');
        const sql1 = `CREATE TABLE IF NOT EXISTS \`conversations\` (
                \`conversation_id\` INT(11) NOT NULL AUTO_INCREMENT,
                \`type\` VARCHAR(50) NOT NULL DEFAULT 'direct',
                \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`conversation_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`;

        const sql2 = `CREATE TABLE IF NOT EXISTS \`conversation_participants\` (
                \`id\` INT(11) NOT NULL AUTO_INCREMENT,
                \`conversation_id\` INT(11) NOT NULL,
                \`user_id\` INT(11) NOT NULL,
                PRIMARY KEY (\`id\`),
                KEY \`idx_conv\` (\`conversation_id\`),
                KEY \`idx_user\` (\`user_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`;

        try {
            await query(pool, sql1);
            await query(pool, sql2);
            console.log('Ensured conversation tables exist');
        } catch (err) {
            console.error('Failed to ensure conversation tables:', err && err.message ? err.message : err);
        }
}

const PORT = process.env.PORT || 3000;
// Export app for tests
module.exports = app;

// If this file is run directly, start the server. When required by tests, do not bind the port.
if (require.main === module) {
    ensureConversationTables().then(() => {
        server.listen(PORT, '0.0.0.0', () => console.log(`Backend running on http://0.0.0.0:${PORT}`));
    }).catch(err => {
        console.error('Startup error ensuring tables:', err && err.message ? err.message : err);
        server.listen(PORT, '0.0.0.0', () => console.log(`Backend running on http://0.0.0.0:${PORT}`));
    });
}
