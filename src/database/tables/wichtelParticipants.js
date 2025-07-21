const { getConnection } = require('../database');
const logger = require('../../logging/logger');
module.exports = {
    name: 'wichtel_participants',
    schema: `CREATE TABLE IF NOT EXISTS wichtel_participants (
        id VARCHAR(255) PRIMARY KEY,
        dcName VARCHAR(255),
        steamName VARCHAR(255),
        steamFriendCode VARCHAR(255),
        participates BOOLEAN DEFAULT FALSE
    )`,

    /**
     * Fetches the list of participants from the database.
     * Uses caching to improve performance for frequent requests.
     * Executes a query to retrieve all records from the "wichtelParticipants" table.
     * Handles errors gracefully and ensures the database connection is released.
     *
     * @return {Promise<Array>} A promise that resolves to an array of participant records.
     * If an error occurs, resolves to an empty array.
     */
    async getParticipants() {
        let connection;

        try {
            connection = await getConnection();

            const query = 'SELECT * FROM wichtel_participants WHERE participates = TRUE';
            const [result] = await connection.query(query);
            logger.debug(`Got ${result.length} participants`, __filename);

            return result;
        } catch (error) {
            logger.error(`Error while getting participants:\n${error}`, __filename);
            return [];
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    /**
     * Inserts a new participant into the database or updates the existing participant's information.
     * Invalidates the participant cache to ensure fresh data on the next query.
     *
     * @param {Object} participant - The participant data to insert or update.
     * @param {number} participant.id - The unique identifier of the participant.
     * @param {string} participant.dcName - The participant's Discord name.
     * @param {string} participant.steamName - The participant's Steam name.
     * @param {string} participant.steamFriendCode - The participant's Steam friend code.
     * @return {Promise<void>} A promise that resolves when the operation completes.
     */
    async insertOrUpdateParticipant(participant) {
        let connection;

        try {
            connection = await getConnection();

            const query = `
                INSERT INTO wichtel_participants (id, dcName, steamName, steamFriendCode, participates)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    dcName = VALUES(dcName),
                    steamName = VALUES(steamName),
                    steamFriendCode = VALUES(steamFriendCode),
                    participates = VALUES(participates)
            `;
            await connection.query(
                query,
                [participant.id, participant.dcName, participant.steamName, participant.steamFriendCode, true],
            );
            logger.debug(`Inserted or updated the participant: ${participant.id}`, __filename);
        } catch (error) {
            logger.error(
                `Error while inserting or updating the participant: ${participant.id}\n${error}`,
                __filename,
            );
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    /**
     * Resets the participation status of all participants in the wichtelParticipants table to false.
     * Updates the database to indicate that no participants are currently active.
     * Invalidates the participant cache to ensure fresh data on the next query.
     * Logs the operation status or any encountered errors.
     *
     * @return {Promise<void>} A promise that resolves when the operation is complete.
     */
    async resetParticipants() {
        let connection;

        try {
            connection = await getConnection();

            const query = 'UPDATE wichtel_participants SET participates = FALSE';
            await connection.query(query);
            logger.debug('Reset all participants', __filename);
        } catch (error) {
            logger.error(`Error while resetting all participants:\n${error}`, __filename);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};