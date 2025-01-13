const logger = require('../../logging/logger');

module.exports = {
    name: 'nodeError',
    async execute(node) {
        logger.warn(`[RIFFY] Node ${node.name} encountered an error: ${error.message}`);
    }
};