// Imports
const { withConnection } = require('../withConnection');
const logger = require('../../logging/logger');

const UPSERT_QUERY = `INSERT INTO data_store (id, data)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE data = ?
`;

module.exports = {
    /**
     * Retrieves "wichtel" data from the data store.
     * Fetches the data associated with the identifier 'wichtelData', parses it, and returns the result.
     * If no data is found or an error occurs, null is returned.
     *
     * @return {Promise<Object|null>} The parsed wichtel data if available, or null if no data is found or an
     * error occurs.
     */
    getWichtelData() {
        return withConnection({
            file: __filename,
            error: 'Error while getting wichtel data:',
            fallback: null,
        }, async (connection) => {
            const query = 'SELECT data FROM data_store WHERE id = ?';
            const [result] = await connection.query(query, ['wichtelData']);

            if (result.length > 0 && result[0].data) {
                const raw = result[0].data;

                if (typeof raw === 'string') {
                    return JSON.parse(raw);
                }
                return raw;
            }

            logger.debug('No wichtel data found.', __filename);
            return null;
        });
    },

    /**
     * Inserts or updates wichtel data in the dataStore.
     *
     * @param {Object} data - The data to be stored or updated in the database.
     * @return {Promise<void>} A promise that resolves when the operation is complete.
     */
    setWichtelData(data) {
        return withConnection({
            file: __filename,
            error: 'Error while inserting wichtel data:',
        }, async (connection) => {
            const jsonData = JSON.stringify(data);

            await connection.query(UPSERT_QUERY, ['wichtelData', jsonData, jsonData]);
            logger.debug(`Inserted wichtel data: ${jsonData}`, __filename);
        });
    },

    /**
     * Saves the matches of the last wichteln (who gives whom a gift), so they are not lost if a message to a
     * participant could not be sent. They can be read from the data store by hand.
     *
     * @param {Array<{giver: string, receiver: string}>} matches - The ids of the giver and the receiver.
     * @return {Promise<void>} A promise that resolves when the operation is complete.
     */
    setWichtelMatches(matches) {
        return withConnection({
            file: __filename,
            error: 'Error while saving wichtel matches:',
        }, async (connection) => {
            const matchesJson = JSON.stringify(matches);

            await connection.query(UPSERT_QUERY, ['wichtelMatches', matchesJson, matchesJson]);
            logger.debug(`Saved ${matches.length} wichtel matches.`, __filename);
        });
    },
};
