// Imports
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../logging/logger.js');
require('dotenv').config();

// Environmental data
const token = process.env.APP_ENV === 'dev'
	? process.env.PASALACKEN_TOKEN_DEV
	: process.env.PASALACKEN_TOKEN_PROD;
const clientId = process.env.APP_ENV === 'dev'
	? process.env.PASALACKEN_CLIENT_ID_DEV
	: process.env.PASALACKEN_CLIENT_ID_PROD;

const commands = [];
const commandsPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

async function deploy() {
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
		logger.error(error, __filename);

		return -1;
	}
}

module.exports = deploy;