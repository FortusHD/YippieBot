// Imports
const logger = require('../logging/logger');
const config = require('config');

let localClient = null;

/**
 * Starts the idle loop for the provided client, which executes periodically at a set interval.
 *
 * @param {Object} client - The client object to be used within the idle loop.
 * @return {void} This function does not return a value.
 */
async function startIdleLoop(client) {
	localClient = client;

	logger.info('Starting "idleLoop"');
	setInterval(idleLoop, 1000);
}

/**
 * Manages an inactivity timer for a music bot based on the state of the current queue.
 * If the queue is empty or undefined, a disconnect timer is set. Otherwise, the timer is cleared.
 *
 * @return {void} No return value.
 */
function idleLoop() {
	const queue = localClient.distube.getQueue(localClient.guilds.cache.get(config.get('GUILD_ID')));

	if (localClient.distube.voices.get(config.get('GUILD_ID')) && (!queue || !queue.songs || queue.songs.length === 0)) {
		// Start timer

		idleLoop.disconnectTimer = setTimeout(async () => {
			await localClient.distube.voices.leave(config.get('GUILD_ID'));
			logger.info('Bot disconnected due to inactivity.');
		}, 5 * 60 * 1000);
		logger.info('Inactivity timer started.');
	} else {
		// End timer
		if (idleLoop.disconnectTimer) {
			clearTimeout(idleLoop.disconnectTimer);
			delete idleLoop.disconnectTimer;
			logger.info('Inactivity timer cleared.');
		}
	}
}

module.exports = { startIdleLoop };