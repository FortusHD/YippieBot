module.exports = {
    description: 'polls.maxVotes is nullable again: NULL means "no vote limit"',

    // Fixes databases where 002 already made the column NOT NULL (a no-op everywhere else)
    async up(connection) {
        await connection.query('ALTER TABLE polls MODIFY maxVotes TINYINT UNSIGNED NULL');
    },
};
