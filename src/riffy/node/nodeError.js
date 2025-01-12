const client = require('../../main/main');
const logger = require('../../logging/logger');

client.riffy.on('nodeError', async (node, error) => {
    logger.warn(`[RIFFY] Node ${node.name} encountered an error: ${error.message}`);
});