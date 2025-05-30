const logger = require('../../logging/logger');

module.exports = {
    name: 'trackError',
    async execute(player, track, payload) {
        const trackTitle = track?.info?.title || track.name || 'Unknown Title';
        logger.warn(`[RIFFY] Error while playing track "${trackTitle}": ${payload}`);

        // Attempt to recover by skipping to the next track if available
        try {
            if (player.queue && player.queue.size > 0) {
                logger.info('[RIFFY] Attempting to recover by skipping to the next track.');
                player.stop();
            }
        } catch (recoveryError) {
            logger.error(`[RIFFY] Failed to recover from track error: ${recoveryError.message}`);

            // If recovery fails, try to reset the player
            try {
                if (player.disconnect) {
                    const disconnected = await player.disconnect();
                    if (disconnected?.destroy) {
                        await disconnected.destroy();
                    }
                    logger.info('[RIFFY] Player reset due to unrecoverable error.');
                }
            } catch (resetError) {
                logger.error(`[RIFFY] Failed to reset player: ${resetError.message}`);
            }
        }
    },
};
