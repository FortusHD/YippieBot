const TABLES = ['message_ids', 'wichtel_participants', 'data_store', 'polls'];

module.exports = {
    description: 'Use utf8mb4 everywhere (emojis in names)',

    async up(connection) {
        await connection.query('ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        for (const table of TABLES) {
            await connection.query(`ALTER TABLE ${table} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        }
    },
};
