// Imports
const { getConnection } = require('../database');
const logger = require('../../logging/logger');

module.exports = {
    name: 'polls',
    schema: `CREATE TABLE IF NOT EXISTS polls (
        messageId VARCHAR(255) PRIMARY KEY,
        channelId VARCHAR(255),
        endTime TIMESTAMP,
        maxVotes TINYINT UNSIGNED
    )`,

    /**
     * Retrieves a poll record by its associated message ID from the database.
     *
     * @param {string} messageId - The ID of the message associated with the poll to retrieve.
     * @return {Promise<Object|null>} A promise that resolves to the poll object if found,
     * or null if no poll exists for the given message ID.
     */
    async getPoll(messageId) {
        let connection;

        try {
            connection = await getConnection();

            const query = 'SELECT * FROM polls WHERE messageId = ?';
            const [result] = await connection.query(query, [messageId]);
            logger.debug(`Got poll with id: ${messageId}`, __filename);

            return result[0] ?? null;
        } catch (error) {
            logger.error(`Error while getting poll with id: ${messageId}\n${error}`, __filename);
            return null;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    /**
     * Retrieves all polls that have ended (polls with an endTime prior to the current time).
     * This method interacts with the database to fetch the relevant data.
     * In case of any errors during the process, an empty array is returned.
     *
     * @return {Promise<Array<Object>>} A promise that resolves to an array of ended polls
     * or an empty array if an error occurs.
     */
    async getEndedPolls() {
        let connection;

        try {
            connection = await getConnection();

            const selectQuery = 'SELECT * FROM polls WHERE endTime < NOW();';
            const [result] = await connection.query(selectQuery);
            if (result.length > 0) {
                logger.debug(`Got ${result.length} ended polls.`, __filename);
            }
            const deleteQuery = 'DELETE FROM polls WHERE endTime < NOW();';
            await connection.query(deleteQuery);

            return result;
        } catch (error) {
            logger.error(`Error while getting all ended polls:\n${error}`, __filename);
            return [];
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    /**
     * Retrieves all polls from the database.
     *
     * @return {Promise<Array>} A promise that resolves to an array of poll objects.
     * If an error occurs, it resolves to an empty array.
     */
    async getAllPolls() {
        let connection;

        try {
            connection = await getConnection();

            const query = 'SELECT * FROM polls';
            const [result] = await connection.query(query);
            logger.debug(`Got ${result.length} polls.`, __filename);

            return result;
        } catch (error) {
            logger.error(`Error while getting all channel IDs:\n${error}`, __filename);
            return [];
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    /**
     * Inserts a poll into the database.
     *
     * @param {Object} poll - The poll data to be inserted.
     * @param {string} poll.messageId - The ID of the message associated with the poll.
     * @param {string} poll.channelId - The ID of the channel where the poll is located.
     * @param {Date} poll.endTime - The expiration time of the poll.
     * @param {number} poll.maxVotes - The maximum number of votes allowed in the poll.
     * @return {Promise<void>} A promise indicating the completion of the insertion operation.
     */
    async insertPoll(poll) {
        let connection;

        try {
            connection = await getConnection();

            const query = `
                INSERT INTO polls (messageId, channelId, endTime, maxVotes)
                VALUES (?, ?, ?, ?)
            `;
            await connection.query(query, [poll.messageId, poll.channelId, poll.endTime, poll.maxVotes]);
            logger.debug(`Inserted poll with id: ${poll.messageId}`, __filename);

            connection.release();
        } catch (error) {
            logger.error(`Error while inserting poll with id: ${poll.messageId}\n${error}`, __filename);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
};