const { columnExists } = require('./_helpers');

const TABLES = ['message_ids', 'wichtel_participants', 'data_store', 'polls'];

module.exports = {
    description: 'Add created_at / updated_at to all tables',

    async up(connection) {
        for (const table of TABLES) {
            if (!(await columnExists(connection, table, 'created_at'))) {
                await connection.query(
                    `ALTER TABLE ${table} ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`,
                );
            }
            if (!(await columnExists(connection, table, 'updated_at'))) {
                await connection.query(`ALTER TABLE ${table} ADD COLUMN updated_at TIMESTAMP NOT NULL `
                    + 'DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
            }
        }
    },
};
