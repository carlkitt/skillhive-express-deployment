if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// =======================
// MySQL Query Library
// =======================
const mysql = require('mysql2');

// Create a shared pool instance using environment variables (fall back to embedded values if env not set)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'bjhvgr90ewlwfy7hvrrp-mysql.services.clever-cloud.com',
    user: process.env.DB_USER || 'umhwrkzsbn2bdp7p',
    password: process.env.DB_PASSWORD || '0EjHTPEKuIGD9jXtEPbK',
    database: process.env.DB_NAME || 'bjhvgr90ewlwfy7hvrrp',
});

/**
 * Create a MySQL connection pool
 * @param {Object} config - MySQL connection config
 */
function createPool(config) {
    return mysql.createPool(config);
}

/**
 * Run a query using the pool
 * @param {Object} pool - MySQL connection pool
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<any>} - Resolves with query result
 */
function query(pool, sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

module.exports = {
    createPool,
    query,
    pool
};
