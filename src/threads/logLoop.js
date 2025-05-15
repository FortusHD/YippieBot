const logger = require('../logging/logger');
const { deleteOldLogs } = require('../logging/logger');

/**
 * Executes a logging operation to indicate the start of an old log deletion process,
 * and triggers the deletion of outdated logs through the deleteOldLogs function.
 *
 * @return {void} This method does not return a value.
 */
function logLoop() {
    logger.info('Deleting old logs...');
    deleteOldLogs();
}

/**
 * Starts a logging loop that calls the `logLoop` function at regular intervals.
 * Logs a message when the loop begins.
 * The interval is set to run once every 24 hours.
 *
 * @return {void} Does not return a value.
 */
async function startLogLoop() {
    logger.info('Starting "logLoop"');
    logLoop();
    setInterval(logLoop, 24 * 60 * 60 * 1000);
}

module.exports = { startLogLoop };