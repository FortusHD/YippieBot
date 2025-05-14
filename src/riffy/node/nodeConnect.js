const logger = require('../../logging/logger');
const { setLavalinkConnected } = require('../../health/healthEndpoint');

module.exports = {
    name: 'nodeConnect',
    async execute(node) {
        setLavalinkConnected(true);
        logger.info(`[RIFFY] Node ${node.name} has connected.`);
    },
};

