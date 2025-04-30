const fs = require('fs');
const path = require('path');
const { getMigrationData, migrateChanges } = require('../util/json_manager');
const logger = require('../logging/logger');

/**
 * Executes the migration process by reading the current application version,
 * comparing it with the existing migration data, and applying appropriate changes.
 *
 * The method identifies and processes all migration steps required to update
 * the application to the latest version. Each migration involves updating files
 * based on specific changes defined in the migration data.
 *
 * @return {Promise<void>} A promise that resolves when the migration process completes.
 */
async function migrate() {
    // Get the current running version
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;

    // Collect migration data
    const migrationData = getMigrationData();

    if (migrationData.length === null) {
        return;
    }

    // Migrate
    for (const migration of migrationData) {
        if (migration.version <= currentVersion) {
            logger.info(`Migrating to version ${migration.version}`);
            for (const migrationReq of migration.migrations) {
                const filePath = path.join(__dirname, '../..', migrationReq.file);
                logger.info(`Migrating ${migrationReq.file}`);
                migrateChanges(filePath, migrationReq.changes);
            }
        }
    }
}

module.exports = migrate;