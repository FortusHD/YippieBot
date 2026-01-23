// Imports
const { getConnection } = require('../database');
const logger = require('../../logging/logger');

module.exports = {
    name: 'data_store',
    schema: `CREATE TABLE IF NOT EXISTS data_store (
        id VARCHAR(255) PRIMARY KEY,
        data JSON NOT NULL
    )`,

    /**
     * Retrieves "wichtel" data from the data store.
     * Fetches the data associated with the identifier 'wichtelData', parses it, and returns the result.
     * If no data is found or an error occurs, null is returned.
     *
     * @return {Object|null} The parsed wichtel data if available, or null if no data is found or an error occurs.
     */
    async getWichtelData() {
        let connection;

        try {
            connection = await getConnection();

            const query = 'SELECT data FROM data_store WHERE id = ?';
            const [result] = await connection.query(query, ['wichtelData']);

            if (result.length > 0 && result[0].data) {
                const raw = result[0].data;

                if (typeof raw === 'string') {
                    return JSON.parse(raw);
                }
                return raw;
            } else {
                logger.debug('No wichtel data found.', __filename);
                return null;
            }
        } catch (error) {
            logger.error(`Error while getting wichtel data:\n${error}`, __filename);
            return null;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    /**
     * Inserts or updates wichtel data in the dataStore.
     *
     * @param {Object} data - The data to be stored or updated in the database.
     * @return {Promise<void>} A promise that resolves when the operation is complete.
     */
    async setWichtelData(data) {
        let connection;

        try {
            connection = await getConnection();

            const jsonData = JSON.stringify(data);

            const query = `INSERT INTO data_store (id, data)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE data = VALUES(data)
            `;
            await connection.query(query, ['wichtelData', jsonData]);
            logger.debug(`Inserted wichtel data: ${jsonData}`, __filename);
        } catch (error) {
            logger.error(`Error while inserting wichtel data:\n${error}`, __filename);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};