// Imports
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../logging/logger.js');
const { handleError, ErrorType } = require('../logging/errorHandler');
const { getEnv } = require('../util/config');

async function deploy() {
    // Environmental data
    const token = getEnv('APP_ENV', 'dev') === 'dev'
        ? getEnv('PASALACKEN_TOKEN_DEV')
        : getEnv('PASALACKEN_TOKEN_PROD');
    const clientId = getEnv('APP_ENV', 'dev') === 'dev'
        ? getEnv('PASALACKEN_CLIENT_ID_DEV')
        : getEnv('PASALACKEN_CLIENT_ID_PROD');

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