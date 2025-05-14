// Imports
const express = require('express');
const logger = require('../logging/logger');
const { getHttpPort } = require('../util/config');

const app = express();
const port = getHttpPort();

// Save lavalink status
let lavalinkConnected = false;

function setLavalinkConnected(connected) {
    lavalinkConnected = connected;
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.send(lavalinkConnected);
});

function start() {
    app.listen(port, () => {
        logger.info(`Health check endpoint listening on port ${port}`);
    });
}

module.exports = { start, setLavalinkConnected };