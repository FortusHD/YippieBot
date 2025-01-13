const logger = require('../../logging/logger');

module.exports = {
	name: 'trackStart',
	async execute(player, track) {
		logger.info(`[RIFFY] Now playing: "${track.info.title}" requested by "${track.info.requester.user.username}"`);
	}
};