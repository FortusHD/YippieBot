const { indexExists } = require('./_helpers');

module.exports = {
    description: 'NOT NULL constraints and an index on polls.endTime',

    async up(connection) {
        // Polls without an end time would never end: close them right away so the poll loop handles them
        await connection.query('UPDATE polls SET endTime = NOW() WHERE endTime IS NULL');
        // maxVotes stays nullable: NULL means "no vote limit"
        await connection.query('ALTER TABLE polls MODIFY endTime TIMESTAMP NOT NULL');

        if (!(await indexExists(connection, 'polls', 'idx_polls_endTime'))) {
            await connection.query('CREATE INDEX idx_polls_endTime ON polls (endTime)');
        }

        await connection.query('UPDATE wichtel_participants SET participates = FALSE WHERE participates IS NULL');
        await connection.query(`UPDATE wichtel_participants SET
            dcName = COALESCE(dcName, ''),
            steamName = COALESCE(steamName, ''),
            steamFriendCode = COALESCE(steamFriendCode, '')`);
        await connection.query(`ALTER TABLE wichtel_participants
            MODIFY dcName VARCHAR(255) NOT NULL,
            MODIFY steamName VARCHAR(255) NOT NULL,
            MODIFY steamFriendCode VARCHAR(255) NOT NULL,
            MODIFY participates BOOLEAN NOT NULL DEFAULT FALSE`);
    },
};
