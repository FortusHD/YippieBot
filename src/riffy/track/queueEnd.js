const logger = require('../../logging/logger');

module.exports = {
    name: 'queueEnd',
    async execute(player) {
        logger.info('[RIFFY] Queue has ended.');
        if (player) {
            if (!player.disconnectTimer) {
                player.disconnectTimer = setTimeout(async () => {
                    if (player?.disconnect) {
                        const disconnected = await player.disconnect();
                        if (disconnected?.destroy) {
                            await disconnected.destroy();
                        }
                    }
                    logger.info('Bot disconnected due to inactivity.');
                    delete player.disconnectTimer;
                }, 5 * 60 * 1000);
                logger.info('Inactivity timer started.');
            }
        }
    },
};

