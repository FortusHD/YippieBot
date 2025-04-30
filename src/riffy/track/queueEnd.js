const logger = require('../../logging/logger');

module.exports = {
    name: 'queueEnd',
    async execute(player) {
        logger.info('[RIFFY] Queue has ended.');
        if (!player.disconnectTimer) {
            player.disconnectTimer = setTimeout(async () => {
                await player.disconnect().destroy();
                logger.info('Bot disconnected due to inactivity.');
                delete player.disconnectTimer;
            }, 5 * 60 * 1000);
            logger.info('Inactivity timer started.');
        }
    },
};

