// Imports
const { withConnection } = require('../withConnection');
const logger = require('../../logging/logger');

module.exports = {
    /**
     * Retrieves a poll record by its associated message ID from the database.
     *
     * @param {string} messageId - The ID of the message associated with the poll to retrieve.
     * @return {Promise<Object|null>} A promise that resolves to the poll object if found,
     * or null if no poll exists for the given message ID.
     */
    getPoll(messageId) {
        return withConnection({
            file: __filename,
            error: `Error while getting poll with id: ${messageId}`,
            fallback: null,
        }, async (connection) => {
            const query = 'SELECT * FROM polls WHERE messageId = ?';
            const [result] = await connection.query(query, [messageId]);
            logger.debug(`Got poll with id: ${messageId}`, __filename);

            return result[0] ?? null;
        });
    },

    /**
     * Retrieves all polls that have ended (polls with an endTime prior to the current time).
     * The polls are NOT deleted, use deletePoll after the result was handled.
     * In case of any errors during the process, an empty array is returned.
     *
     * @return {Promise<Array<Object>>} A promise that resolves to an array of ended polls
     * or an empty array if an error occurs.
     */
    getEndedPolls() {
        return withConnection({
            file: __filename,
            error: 'Error while getting all ended polls:',
            fallback: [],
        }, async (connection) => {
            const selectQuery = 'SELECT * FROM polls WHERE endTime < NOW();';
            const [result] = await connection.query(selectQuery);
            if (result.length > 0) {
                logger.debug(`Got ${result.length} ended polls.`, __filename);
            }

            return result;
        });
    },

    /**
     * Retrieves all polls from the database.
     *
     * @return {Promise<Array>} A promise that resolves to an array of poll objects.
     * If an error occurs, it resolves to an empty array.
     */
    getAllPolls() {
        return withConnection({
            file: __filename,
            error: 'Error while getting all polls:',
            fallback: [],
        }, async (connection) => {
            const query = 'SELECT * FROM polls';
            const [result] = await connection.query(query);
            logger.debug(`Got ${result.length} polls.`, __filename);

            return result;
        });
    },

    /**
     * Inserts a poll into the database.
     *
     * @param {Object} poll - The poll data to be inserted.
     * @param {string} poll.messageId - The ID of the message associated with the poll.
     * @param {string} poll.channelId - The ID of the channel where the poll is located.
     * @param {Date} poll.endTime - The expiration time of the poll.
     * @param {number|null} poll.maxVotes - The maximum number of votes allowed in the poll (null = no limit).
     * @return {Promise<void>} A promise indicating the completion of the insertion operation.
     */
    insertPoll(poll) {
        return withConnection({
            file: __filename,
            error: `Error while inserting poll with id: ${poll.messageId}`,
        }, async (connection) => {
            const query = `
                INSERT INTO polls (messageId, channelId, endTime, maxVotes)
                VALUES (?, ?, ?, ?)
            `;
            await connection.query(query, [poll.messageId, poll.channelId, poll.endTime, poll.maxVotes]);
            logger.debug(`Inserted poll with id: ${poll.messageId}`, __filename);
        });
    },

    /**
     * Deletes a poll from the database.
     *
     * @param {string} messageId - The id of the poll message.
     * @return {Promise<void>} A promise indicating the completion of the deletion.
     */
    deletePoll(messageId) {
        return withConnection({
            file: __filename,
            error: `Error while deleting poll with id: ${messageId}`,
        }, async (connection) => {
            await connection.query('DELETE FROM polls WHERE messageId = ?', [messageId]);
            logger.debug(`Deleted poll with id: ${messageId}`, __filename);
        });
    },
};
