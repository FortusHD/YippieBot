// Imports
const { getConnection } = require('../database');
const logger = require('../../logging/logger');

module.exports = {
    name: 'message_ids',
    schema: `CREATE TABLE IF NOT EXISTS message_ids (
        id VARCHAR(255) PRIMARY KEY,
        value VARCHAR(255)
    )`,

    /**
     * Retrieves a value based on the provided id from the specified database table.
     *
     * @param {number|string} id - The identifier used to fetch the corresponding value from the database.
     * @return {Promise<string|null>} A promise that resolves to the retrieved value as a string,
     * or null if an error occurs or the id does not exist.
     */
    async getId(id) {
        let connection;

        try {
            connection = await getConnection();

            const query = 'SELECT value FROM message_ids WHERE id = ?';
            const [result] = await connection.query(query, [id]);
            logger.debug(`Got the id: ${id} with value: ${result[0]?.value}`, __filename);

            return result[0]?.value ?? null;
        } catch (error) {
            logger.error(`Error while getting the id: ${id}\n${error}`, __filename);
            return null;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    /**
     * Inserts or updates a given id with its associated value in the database table.
     * If the id already exists, its value is updated; otherwise, a new entry is created.
     *
     * @param {string|number} id - The unique identifier to be inserted or updated in the table.
     * @param {*} value - The value to be associated with the given id in the table.
     * @return {Promise<void>} A promise that resolves when the operation is successfully completed.
     */
    async insertOrUpdateId(id, value) {
        let connection;

        try {
            connection = await getConnection();

            const query = `
                INSERT INTO message_ids (id, value)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE value = VALUES(value)
            `;
            await connection.query(query, [id, value]);
            logger.debug(`Inserted or updated the id: ${id} to ${value}`, __filename);
        } catch (error) {
            logger.error(`Error while inserting or updating the id: ${id}\n${error}`, __filename);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};