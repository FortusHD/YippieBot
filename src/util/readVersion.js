// Imports
const fs = require('fs');
const path = require('path');
const logger = require('../logging/logger');

const packageJsonPath = path.join(__dirname, '../../package.json');

/**
 * Retrieves the version number from the package.json file.
 *
 * @return {string} The version number if successfully retrieved and parsed, otherwise returns '-1'.
 */
function getVersion() {
    try {
        const data = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(data);

        logger.debug(`Version: ${packageJson.version}`, __filename);

        return packageJson.version;
    } catch (parseError) {
        logger.warn(`Could not parse package.json:\n${parseError}`);
        return '-1';
    }
}

module.exports = { getVersion };