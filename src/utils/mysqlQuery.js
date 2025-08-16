require('dotenv').config();

// =======================
// MySQL Query Library
// =======================
const mysql = require('mysql');

// Create a shared pool instance using environment variables
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: 'root',
    password: process.env.DB_PASSWORD,
    database: 'skillhivedb'
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
