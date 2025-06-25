/**
 * @fileoverview Command deployment module for Yippie-Bot.
 * This module is responsible for registering slash commands with Discord's API.
 * It reads command files from the commands directory, converts them to JSON format,
 * and sends them to Discord's REST API to register or update them.
 *
 * @module main/deployCommands
 * @requires discord.js
 * @requires fs
 * @requires path
 * @requires ../logging/logger
 * @requires ../logging/errorHandler
 * @requires ../util/config
 */

// Imports
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../logging/logger.js');
const { handleError, ErrorType } = require('../logging/errorHandler');
const { getEnv } = require('../util/config');

/**
 * Deploys all slash commands to Discord.
 * This function reads command files, converts them to JSON format,
 * and registers them with Discord's API using the REST module.
 *
 * @async
 * @function deploy
 * @returns {Promise<number>} The number of commands that were deployed, or -1 if an error occurred
 */
async function deploy() {
    // Environmental data
    const token = getEnv('APP_ENV', 'dev') === 'dev'
        ? getEnv('BOT_TOKEN_DEV')
        : getEnv('BOT_TOKEN_PROD');
    const clientId = getEnv('APP_ENV', 'dev') === 'dev'
        ? getEnv('BOT_CLIENT_ID_DEV')
        : getEnv('BOT_CLIENT_ID_PROD');

    logger.debug(`Using token: ${token.slice(0, 10) }...${ token.slice(-10)} and client ID: ${clientId}`,
        __filename);

    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    // Register commands
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            logger.info(`The command at ${filePath} was registered.`);
        } else {
            logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    const rest = new REST().setToken(token);

    // Refresh commands
    try {
        const data = await rest.put(Routes.applicationCommands(clientId), { body: commands });

        return data.length;
    } catch (error) {
        handleError(error, __filename, {
            type: ErrorType.UNKNOWN_ERROR,
        });

        return -1;
    }
}

module.exports = deploy;
