// Imports
const express = require('express');
const logger = require('../logging/logger');
const { getHttpPort, getHttpHost } = require('../util/config');
const { getVersion } = require('../util/readVersion');

const app = express();
app.disable('x-powered-by');
const port = getHttpPort();
const host = getHttpHost();

// Save lavalink status
let lavalinkConnected = false;

function setLavalinkConnected(connected) {
    lavalinkConnected = connected;
}

// Health check endpoint
app.get('/health', (req, res) => {
    logger.debug(`Health check endpoint called. Sending ${lavalinkConnected}`);
    res.send({
        version: getVersion(),
        lavalink: lavalinkConnected,
    });
});

function start() {
    return app.listen(port, host, () => {
        logger.info(`Health check endpoint listening on ${host}:${port}`);
    });
}

module.exports = { start, setLavalinkConnected };