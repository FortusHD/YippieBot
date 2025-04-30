const logger = require('../../logging/logger');

module.exports = {
    name: 'nodeConnect',
    async execute(node) {
        logger.info(`[RIFFY] Node ${node.name} has connected.`);
    },
};

