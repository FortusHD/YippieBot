const client = require('../../main/main');
const logger = require('../../logging/logger');

client.riffy.on('nodeConnect', async (node) => {
    logger.info(`[RIFFY] Node ${node.name} has connected.`);
});

