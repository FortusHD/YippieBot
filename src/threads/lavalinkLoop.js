const logger = require('../logging/logger');

let localClient = null;

/**
 * Checks the connection status of the Lavalink node and attempts to reconnect if disconnected.
 * Logs the reconnection attempts and potential errors during the process.
 *
 * @return {void} Does not return any value.
 */
function lavalinkLoop() {
    if (localClient) {
        if (!localClient.riffy.nodeMap.get(process.env.LAVALINK_HOST || 'localhost').connected) {
            logger.info('Reconnecting to Lavalink...');
            try {
                localClient.riffy.nodeMap.get(process.env.LAVALINK_HOST || 'localhost').connect();
            } catch (error) {
                logger.warn(`Could not connect to Lavalink: ${ error}`);
            }
        }
    }
}

/**
 * Initializes and starts the Lavalink loop by setting up a periodic interval task.
 *
 * @param {Object} client - The client object used to interact with Lavalink and manage connections.
 * @return {void} No return value.
 */
async function startLavalinkLoop(client) {
    logger.info('Starting "lavalinkLoop"');
    localClient = client;
    setInterval(lavalinkLoop, 30000);
}

module.exports = { startLavalinkLoop };
