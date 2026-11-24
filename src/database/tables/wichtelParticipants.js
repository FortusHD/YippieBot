// Imports
const { withConnection } = require('../withConnection');
const logger = require('../../logging/logger');

module.exports = {
    /**
     * Fetches the list of participants from the database.
     * Executes a query to retrieve all records from the "wichtel_participants" table.
     * Handles errors gracefully and ensures the database connection is released.
     *
     * @return {Promise<Array>} A promise that resolves to an array of participant records.
     * If an error occurs, resolves to an empty array.
     */
    getParticipants() {
        return withConnection({
            file: __filename,
            error: 'Error while getting participants:',
            fallback: [],
        }, async (connection) => {
            const query = 'SELECT * FROM wichtel_participants WHERE participates = TRUE';
            const [result] = await connection.query(query);
            logger.debug(`Got ${result.length} participants`, __filename);

            return result;
        });
    },

    /**
     * Inserts a new participant into the database or updates the existing participant's information.
     *
     * @param {Object} participant - The participant data to insert or update.
     * @param {number} participant.id - The unique identifier of the participant.
     * @param {string} participant.dcName - The participant's Discord name.
     * @param {string} participant.steamName - The participant's Steam name.
     * @param {string} participant.steamFriendCode - The participant's Steam friend code.
     * @return {Promise<void>} A promise that resolves when the operation completes.
     */
    insertOrUpdateParticipant(participant) {
        return withConnection({
            file: __filename,
            error: `Error while inserting or updating the participant: ${participant.id}`,
        }, async (connection) => {
            const query = `
                INSERT INTO wichtel_participants (id, dcName, steamName, steamFriendCode, participates)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    dcName = ?,
                    steamName = ?,
                    steamFriendCode = ?,
                    participates = ?
            `;
            await connection.query(
                query,
                [
                    participant.id, participant.dcName, participant.steamName, participant.steamFriendCode, true,
                    participant.dcName, participant.steamName, participant.steamFriendCode, true,
                ],
            );
            logger.debug(`Inserted or updated the participant: ${participant.id}`, __filename);
        });
    },

    /**
     * Resets the participation status of all participants in the wichtel_participants table to false.
     * Updates the database to indicate that no participants are currently active.
     * Logs the operation status or any encountered errors.
     *
     * @return {Promise<void>} A promise that resolves when the operation is complete.
     */
    resetParticipants() {
        return withConnection({
            file: __filename,
            error: 'Error while resetting all participants:',
        }, async (connection) => {
            const query = 'UPDATE wichtel_participants SET participates = FALSE';
            await connection.query(query);
            logger.debug('Reset all participants', __filename);
        });
    },
};
