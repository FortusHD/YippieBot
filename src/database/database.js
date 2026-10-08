// Imports
const config = require('../util/config');
const logger = require('../logging/logger');
const mysql = require('mysql2/promise');
const path = require('node:path');
const fs = require('node:fs');

const dbConfig = {
    ...config.getDatabase(),
    database: 'yippie_bot',
};

const pool = mysql.createPool({
    ...dbConfig,
    host: dbConfig.host,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
});

// Errors that mean "the database is not reachable (yet)", e.g. while the database container is still starting
const RETRYABLE_ERRORS = [
    'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'PROTOCOL_CONNECTION_LOST',
];

/**
 * Opens a connection to the database. If the database is not reachable yet, it is retried a few times.
 * Other errors (e.g. wrong credentials) are thrown immediately.
 *
 * @param {number} retries - The maximum number of connection attempts.
 * @param {number} delayMs - The time to wait between two attempts in milliseconds.
 * @return {Promise<import(mysql2).Connection>} A promise that resolves to the connection.
 */
async function connectWithRetry(retries, delayMs) {
    for (let attempt = 1; ; attempt++) {
        try {
            return await mysql.createConnection(dbConfig);
        } catch (error) {
            if (attempt >= retries || !RETRYABLE_ERRORS.includes(error.code)) {
                throw error;
            }
            logger.warn(`Database not reachable (attempt ${attempt}/${retries}): ${error.code}. `
                + `Retrying in ${delayMs / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}

/**
 * Sets up the database tables. The database and the user are NOT created here, this is done by the database
 * container itself (MYSQL_DATABASE, MYSQL_USER and MYSQL_PASSWORD), so the bot only needs the credentials of its
 * own user and no root access.
 * Waits for the database to become reachable and executes the table schemas defined in external files.
 *
 * @param {Object} [options] - Options for the connection attempts.
 * @param {number} [options.retries=10] - The maximum number of connection attempts.
 * @param {number} [options.delayMs=3000] - The time to wait between two attempts in milliseconds.
 * @return {Promise<void>} A promise that resolves when the database setup is complete.
 * @throws {Error} If the database is not reachable or the tables cannot be created.
 */
async function setup({ retries = 10, delayMs = 3000 } = {}) {
    let connection;

    try {
        connection = await connectWithRetry(retries, delayMs);
        logger.info(`Connected to database "${dbConfig.database}".`);

        // Create tables if needed
        const tablesDir = path.join(__dirname, 'tables');
        const tableFiles = fs.readdirSync(tablesDir).filter((file) => file.endsWith('.js'));

        for (const file of tableFiles) {
            const tableDefinition = require(path.join(tablesDir, file));
            logger.info(`Creating table: ${tableDefinition.name}`);
            await connection.query(tableDefinition.schema);
        }

        logger.info('Database setup complete.');
    } catch (error) {
        logger.error(`Error during database setup: ${error}`);
        // The bot is useless without its database, so let the caller decide (main exits)
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

/**
 * Closes the connection pool. Used for a graceful shutdown.
 *
 * @return {Promise<void>} A promise that resolves when all connections are closed.
 */
async function close() {
    await pool.end();
}

/**
 * Retrieves a connection object from the connection pool.
 * This method should be called to obtain a database connection for executing queries.
 * Ensure to release the connection back to the pool after usage to avoid exhaustion.
 *
 * @return {import(mysql2).PoolConnection} A connection object from the pool.
 */
function getConnection() {
    return pool.getConnection();
}

module.exports = { setup, getConnection, close };