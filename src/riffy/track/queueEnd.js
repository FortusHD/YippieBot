const logger = require('../../logging/logger');

module.exports = {
	name: 'queueEnd',
	async execute(player) {
		logger.info('[RIFFY] Queue has ended.');
		if (!this.disconnectTimer) {
			this.disconnectTimer = setTimeout(async () => {
				await player.disconnect().destroy();
				logger.info('Bot disconnected due to inactivity.');
				delete this.disconnectTimer;
			},  5 * 60 * 1000);
			logger.info('Inactivity timer started.');
		} else {
			clearTimeout(this.disconnectTimer);
			delete this.disconnectTimer;
			logger.info('Inactivity timer cleared.');
		}
	}
};

