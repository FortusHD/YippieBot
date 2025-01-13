const logger = require('../../logging/logger');

module.exports = {
    name: 'trackError',
    async execute(player, track, payload) {
        logger.warn(`[RIFFY] Error while playing track "${track.name ?? 'Unknown Title'}": ${payload}`);
    }
};