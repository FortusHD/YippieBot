const logger = require('../../logging/logger');

module.exports = {
	name: 'trackStart',
	async execute(player, track) {
		if (player.disconnectTimer) {
			clearTimeout(player.disconnectTimer);
			delete player.disconnectTimer;
			logger.info('Inactivity timer cleared.');
		}
		logger.info(`[RIFFY] Now playing: "${track.info.title}" requested by "${track.info.requester.user.username}"`);
	}
};