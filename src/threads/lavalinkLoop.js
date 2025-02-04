const logger = require('../logging/logger');
const config = require('config');

let localClient = null;


async function startLavalinkLoop(client) {
	logger.info('Starting "lavalinkLoop"');
	localClient = client;
	setInterval(lavalinkLoop, 30000);
}

function lavalinkLoop() {
	if (localClient) {
		if (!localClient.riffy.nodeMap.get(config.get('LAVALINK')[0].host).connected) {
			logger.info('Reconnecting to Lavalink...');
			try {
				localClient.riffy.nodeMap.get(config.get('LAVALINK')[0].host).connect();
			} catch (error) {
				logger.warn('Could not connect to Lavalink: ' + error);
			}
		}
	}
}


module.exports = { startLavalinkLoop };
