module.exports = {
    description: 'Discord snowflakes are at most 20 digits: use VARCHAR(20) for them',

    async up(connection) {
        // message_ids.id and data_store.id are free-form keys (e.g. "roleId"), so they stay VARCHAR(255)
        await connection.query('ALTER TABLE polls MODIFY messageId VARCHAR(20) NOT NULL, '
            + 'MODIFY channelId VARCHAR(20) NOT NULL');
        await connection.query('ALTER TABLE wichtel_participants MODIFY id VARCHAR(20) NOT NULL');
        await connection.query('ALTER TABLE message_ids MODIFY value VARCHAR(20)');
    },
};
