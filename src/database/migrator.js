// Imports
const path = require('node:path');
const fs = require('node:fs');
const logger = require('../logging/logger');

const MIGRATIONS_TABLE = 'schema_migrations';
const LOCK_NAME = 'yippie_bot_migrations';
const LOCK_TIMEOUT_SECONDS = 30;
const FILE_PATTERN = /^(\d+)_([\w-]+)\.js$/;

/**
 * Reads all migration files from a directory, sorted by version.
 * File names must look like "002_add_something.js"; the number is the version.
 *
 * @param {string} dir - The directory containing the migration files.
 * @return {Array<{version: number, name: string, file: string}>} The migrations in ascending order.
 * @throws {Error} If two files share the same version.
 */
function loadMigrations(dir) {
    const migrations = fs.readdirSync(dir)
        .map((file) => ({ file, match: FILE_PATTERN.exec(file) }))
        .filter(({ match }) => match)
        .map(({ file, match }) => ({ version: Number(match[1]), name: match[2], file }))
        .sort((a, b) => a.version - b.version);

    for (let i = 1; i < migrations.length; i++) {
        if (migrations[i].version === migrations[i - 1].version) {
            throw new Error(`Duplicate migration version ${migrations[i].version}`);
        }
    }

    return migrations;
}

/**
 * Applies all pending migrations in order. A MySQL advisory lock makes sure only one bot instance migrates at a
 * time. Each applied migration is recorded in the schema_migrations table, so it runs exactly once.
 *
 * Note: MySQL commits DDL statements implicitly, so a migration cannot be rolled back as a whole. If one fails
 * it is NOT recorded and runs again on the next start - write migrations so they can safely be re-run
 * (IF NOT EXISTS, checks via information_schema, ...).
 *
 * @param {import('mysql2/promise').Connection} connection - A dedicated connection (the lock belongs to it).
 * @param {string} dir - The directory containing the migration files.
 * @return {Promise<number>} The number of migrations that were applied.
 */
async function migrate(connection, dir = path.join(__dirname, 'migrations')) {
    const [[lock]] = await connection.query('SELECT GET_LOCK(?, ?) AS acquired', [LOCK_NAME, LOCK_TIMEOUT_SECONDS]);
    if (lock?.acquired !== 1) {
        throw new Error('Could not acquire the migration lock (another instance is migrating?)');
    }

    try {
        await connection.query(`CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
            version INT UNSIGNED PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`);

        const [rows] = await connection.query(`SELECT version FROM ${MIGRATIONS_TABLE}`);
        const applied = new Set(rows.map((row) => row.version));

        let count = 0;
        for (const migration of loadMigrations(dir)) {
            if (applied.has(migration.version)) {
                continue;
            }

            logger.info(`Applying migration ${migration.version}: ${migration.name}`);
            const { up } = require(path.join(dir, migration.file));
            await up(connection);
            await connection.query(
                `INSERT INTO ${MIGRATIONS_TABLE} (version, name) VALUES (?, ?)`,
                [migration.version, migration.name],
            );
            count++;
        }

        logger.info(count > 0 ? `Applied ${count} migration(s).` : 'Database schema is up to date.');
        return count;
    } finally {
        await connection.query('SELECT RELEASE_LOCK(?)', [LOCK_NAME]).catch(() => {});
    }
}

module.exports = { migrate, loadMigrations };
