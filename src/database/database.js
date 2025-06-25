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
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
});

/**
 * Sets up the database by ensuring the database exists, creating necessary tables,
 * and establishing database connections.
 * Handles the creation of a new database and the execution of table schemas defined in external files.
 * Logs the progress and errors during the setup process.
 *
 * @return {Promise<void>} A promise that resolves when the database setup is complete and all resources are closed.
 */
async function setup() {
    try {
        // Connect and create db if needed
        const baseConnection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
        });

        await baseConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        await baseConnection.query(`
            GRANT ALL PRIVILEGES ON ${dbConfig.database}.* TO '${dbConfig.user}'@'${dbConfig.host}';
        `);
        await baseConnection.query('FLUSH PRIVILEGES;');

        logger.info(`Database "${dbConfig.database}" is ready.`);
        await baseConnection.end();

        // Create tables if needed
        const connection = await mysql.createConnection(dbConfig);

        const tablesDir = path.join(__dirname, 'tables');
        const tableFiles = fs.readdirSync(tablesDir).filter((file) => file.endsWith('.js'));

        for (const file of tableFiles) {
            const tableDefinition = require(path.join(tablesDir, file));
            logger.info(`Creating table: ${tableDefinition.name}`);
            await connection.query(tableDefinition.schema);
        }

        logger.info('Database setup complete.');
        await connection.end();
    } catch (error) {
        logger.error('Error during database setup:', error);
    }
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

module.exports = { setup, getConnection };