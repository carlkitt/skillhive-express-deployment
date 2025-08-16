// Try to load .env if dotenv is available (don't crash if it's not installed in production)
try { require('dotenv').config(); } catch (err) { /* dotenv not installed; ignore */ }

// =======================
// MySQL Query Library
// =======================
const mysql = require('mysql');

// Singleton pool
let pool;
function createPool(config) {
    if (pool) return pool;
    pool = mysql.createPool(config);
    return pool;
}

// Create the default pool using environment variables (only once)
const CONNECTION_LIMIT = parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 5;
const defaultConfig = {
    host: process.env.DB_HOST || 'bjhvgr90ewlwfy7hvrrp-mysql.services.clever-cloud.com',
    user: process.env.DB_USER || 'umhwrkzsbn2bdp7p',
    password: process.env.DB_PASSWORD || '0EjHTPEKuIGD9jXtEPbK',
    database: process.env.DB_NAME || 'bjhvgr90ewlwfy7hvrrp',
    connectionLimit: CONNECTION_LIMIT,
    waitForConnections: true,
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT, 10) || 100
};
createPool(defaultConfig);

// Simple concurrency queue to limit simultaneous DB operations
const MAX_CONCURRENT_QUERIES = parseInt(process.env.DB_MAX_CONCURRENT_QUERIES, 10) || Math.max(1, CONNECTION_LIMIT);
let currentConcurrent = 0;
const taskQueue = [];

function enqueueTask(fn) {
    return new Promise((resolve, reject) => {
        taskQueue.push({ fn, resolve, reject });
        processQueue();
    });
}

function processQueue() {
    if (currentConcurrent >= MAX_CONCURRENT_QUERIES) return;
    const item = taskQueue.shift();
    if (!item) return;
    currentConcurrent++;
    Promise.resolve()
        .then(() => item.fn())
        .then((res) => {
            currentConcurrent--;
            item.resolve(res);
            processQueue();
        })
        .catch((err) => {
            currentConcurrent--;
            item.reject(err);
            processQueue();
        });
}

// Internal: execute using getConnection to ensure explicit release
function executeWithConnection(usedPool, sql, params = []) {
    return enqueueTask(() => new Promise((resolve, reject) => {
        usedPool.getConnection((err, connection) => {
            if (err) return reject(err);
            // Run query
            connection.query(sql, params, (error, results) => {
                // Always release the connection back to the pool
                try { connection.release(); } catch (releaseErr) { /* ignore release errors */ }
                if (error) return reject(error);
                resolve(results);
            });
        });
    }));
}

/**
 * Run a query using the pool
 * Supports two signatures:
 *  - query(pool, sql, params)
 *  - query(sql, params)          (uses default singleton pool)
 */
function query(poolOrSql, sqlOrParams, paramsMaybe = []) {
    let usedPool = pool;
    let sql = poolOrSql;
    let params = sqlOrParams;

    if (typeof poolOrSql === 'object' && poolOrSql !== null && poolOrSql.getConnection) {
        // signature: query(pool, sql, params)
        usedPool = poolOrSql;
        sql = sqlOrParams;
        params = paramsMaybe;
    }

    if (!Array.isArray(params)) params = [];

    // Use explicit getConnection/release with queueing to avoid exhausting connections
    return executeWithConnection(usedPool, sql, params);
}

module.exports = {
    createPool,
    query,
    pool
};
