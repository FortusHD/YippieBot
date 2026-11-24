// Imports
const { getConnection } = require('./database');
const logger = require('../logging/logger');

/**
 * Runs a function with a connection from the pool. The connection is always released afterwards. Errors
 * (including a failed connection) are logged and never thrown, the fallback is returned instead.
 *
 * @param {Object} options - Options for the call.
 * @param {string} options.file - The file to show in the log (pass `__filename`).
 * @param {string} options.error - The error message to log, the error itself is appended.
 * @param {*} [options.fallback] - The value to return if an error occurs.
 * @param {function(import('mysql2/promise').PoolConnection): Promise<*>} fn - The function to run.
 * @return {Promise<*>} The result of `fn`, or the fallback if an error occurs.
 */
async function withConnection({ file, error, fallback }, fn) {
    let connection;

    try {
        connection = await getConnection();
        return await fn(connection);
    } catch (err) {
        logger.error(`${error}\n${err}`, file);
        return fallback;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = { withConnection };
