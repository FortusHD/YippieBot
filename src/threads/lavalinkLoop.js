// Import
const logger = require('../logging/logger');
const { setLavalinkConnected } = require('../health/healthEndpoint');
const { getLavalinkConfig } = require('../util/config');

let localClient = null;

/**
 * Checks the connection status of the Lavalink node and attempts to reconnect if disconnected.
 * Logs the reconnection attempts and potential errors during the process.
 *
 * @return {void} Does not return any value.
 */
function lavalinkLoop() {
    if (localClient) {
        const host = getLavalinkConfig()?.host || 'localhost';

        logger.debug(`Checking Lavalink connection status for node ${host}`,
            __filename);

        const lavalinkNode = localClient.riffy.nodeMap.get(host);
        setLavalinkConnected(lavalinkNode.connected);

        if (!lavalinkNode.connected) {
            logger.info('Reconnecting to Lavalink...');
            try {
                lavalinkNode.connect();
                setLavalinkConnected(lavalinkNode.connected);
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
