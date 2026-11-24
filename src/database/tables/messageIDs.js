// Imports
const { withConnection } = require('../withConnection');
const logger = require('../../logging/logger');

module.exports = {
    /**
     * Retrieves a value based on the provided id from the specified database table.
     *
     * @param {number|string} id - The identifier used to fetch the corresponding value from the database.
     * @return {Promise<string|null>} A promise that resolves to the retrieved value as a string,
     * or null if an error occurs or the id does not exist.
     */
    getId(id) {
        return withConnection({
            file: __filename,
            error: `Error while getting the id: ${id}`,
            fallback: null,
        }, async (connection) => {
            const query = 'SELECT value FROM message_ids WHERE id = ?';
            const [result] = await connection.query(query, [id]);
            logger.debug(`Got the id: ${id} with value: ${result[0]?.value}`, __filename);

            return result[0]?.value ?? null;
        });
    },

    /**
     * Inserts or updates a given id with its associated value in the database table.
     * If the id already exists, its value is updated; otherwise, a new entry is created.
     *
     * @param {string|number} id - The unique identifier to be inserted or updated in the table.
     * @param {*} value - The value to be associated with the given id in the table.
     * @return {Promise<void>} A promise that resolves when the operation is successfully completed.
     */
    insertOrUpdateId(id, value) {
        return withConnection({
            file: __filename,
            error: `Error while inserting or updating the id: ${id}`,
        }, async (connection) => {
            const query = `
                INSERT INTO message_ids (id, value)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE value = ?
            `;
            await connection.query(query, [id, value, value]);
            logger.debug(`Inserted or updated the id: ${id} to ${value}`, __filename);
        });
    },
};
