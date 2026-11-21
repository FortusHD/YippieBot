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
// The discord client, set by start(). Without a client the discord status is not checked.
let discordClient = null;

function setLavalinkConnected(connected) {
    lavalinkConnected = connected;
}

// Health check endpoint: 200 as long as the bot itself runs, 503 if the discord client is not ready.
// The lavalink status is only reported in the body, a missing lavalink connection does not make the bot unhealthy.
app.get('/health', (req, res) => {
    const discord = discordClient === null ? true : discordClient.isReady();

    logger.debug(`Health check endpoint called. Discord: ${discord}, lavalink: ${lavalinkConnected}`);
    res.status(discord ? 200 : 503).send({
        version: getVersion(),
        discord,
        lavalink: lavalinkConnected,
    });
});

/**
 * Starts the health endpoint.
 *
 * @param {import(discord.js).Client} [client] - The discord client, whose ready state is part of the health status.
 * @return {import(http).Server} The server of the endpoint.
 */
function start(client = null) {
    discordClient = client;
    return app.listen(port, host, () => {
        logger.info(`Health check endpoint listening on ${host}:${port}`);
    });
}

module.exports = { start, setLavalinkConnected };
