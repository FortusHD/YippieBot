const client = require('../../main/main');
const logger = require('../../logging/logger');

client.riffy.on('trackError', async (player, track, payload) => {
    logger.warn(`[RIFFY] Error while playing track "${track.name ?? 'Unknown Title'}": ${payload}`);
});