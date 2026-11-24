// Baseline: the schema as it existed before migrations were introduced.
// It uses IF NOT EXISTS, so existing databases simply adopt it without any change.
module.exports = {
    description: 'Initial schema (message_ids, wichtel_participants, data_store, polls)',

    /**
     * @param {import('mysql2/promise').Connection} connection - Connection to run the statements on.
     * @return {Promise<void>}
     */
    async up(connection) {
        await connection.query(`CREATE TABLE IF NOT EXISTS message_ids (
            id VARCHAR(255) PRIMARY KEY,
            value VARCHAR(255)
        )`);

        await connection.query(`CREATE TABLE IF NOT EXISTS wichtel_participants (
            id VARCHAR(255) PRIMARY KEY,
            dcName VARCHAR(255),
            steamName VARCHAR(255),
            steamFriendCode VARCHAR(255),
            participates BOOLEAN DEFAULT FALSE
        )`);

        await connection.query(`CREATE TABLE IF NOT EXISTS data_store (
            id VARCHAR(255) PRIMARY KEY,
            data JSON NOT NULL
        )`);

        await connection.query(`CREATE TABLE IF NOT EXISTS polls (
            messageId VARCHAR(255) PRIMARY KEY,
            channelId VARCHAR(255),
            endTime TIMESTAMP,
            maxVotes TINYINT UNSIGNED
        )`);
    },
};
