const client = require('../../main/main');
const logger = require('../../logging/logger');

client.riffy.on('trackStart', async (player, track) => {
	if (track !== undefined) {
		logger.info(`[RIFFY] Now playing: "${track.info.title}" requested by "${track.info.requester.user.username}"`);
	}
});