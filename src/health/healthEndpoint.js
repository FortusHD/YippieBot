// Imports
const express = require('express');
const logger = require('../logging/logger');
const { getHttpPort } = require('../util/config');
const { getVersion } = require('../util/readVersion');

const app = express();
const port = getHttpPort();

// Save lavalink status
let lavalinkConnected = false;

function setLavalinkConnected(connected) {
    lavalinkConnected = connected;
}

// Health check endpoint
app.get('/health', (req, res) => {
    logger.debug(`Health check endpoint called. Sending ${lavalinkConnected}`);
    // TODO: Change Yippie-Bot-Health to also look for the version (downwards compatible)
    res.send({
        version: getVersion(),
        lavalink: lavalinkConnected,
    });
});

function start() {
    return app.listen(port, () => {
        logger.info(`Health check endpoint listening on port ${port}`);
    });
}

module.exports = { start, setLavalinkConnected };