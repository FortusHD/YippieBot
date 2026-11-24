// Helpers for migrations (ignored by the migrator, it only loads files named NNN_name.js)

/**
 * Checks whether a column exists in the current database.
 *
 * @param {import('mysql2/promise').Connection} connection - The connection to use.
 * @param {string} table - The table name.
 * @param {string} column - The column name.
 * @return {Promise<boolean>} True if the column exists.
 */
async function columnExists(connection, table, column) {
    const [rows] = await connection.query(
        `SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column],
    );
    return rows.length > 0;
}

/**
 * Checks whether an index exists in the current database.
 *
 * @param {import('mysql2/promise').Connection} connection - The connection to use.
 * @param {string} table - The table name.
 * @param {string} index - The index name.
 * @return {Promise<boolean>} True if the index exists.
 */
async function indexExists(connection, table, index) {
    const [rows] = await connection.query(
        `SELECT 1 FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [table, index],
    );
    return rows.length > 0;
}

module.exports = { columnExists, indexExists };
