// Imports
const fs = require('fs');
const path = require('path');
const logger = require('../logging/logger.js');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { colors } = require('../logging/logger');
const { getVersion } = require('../util/readVersion');
const {Riffy} = require('riffy');
const config = require('config');
const deploy = require('./deployCommands');
require('dotenv').config();

logger.info('Starting Yippie-Bot');
logger.info(`Running on version: ${getVersion()}`);


// Register commands (to discord) on startup
if (process.env.DEPLOY === 'true') {
	logger.info('Deploying commands...');
	deploy().then((loadedCommands) => {
		if (loadedCommands > 0) {
			logger.info(`Successfully deployed ${loadedCommands} commands.`);
		} else {
			logger.warn('No commands were deployed.');
		}
	});
}


// Constants
// Bot Token from env
const token = process.env.APP_ENV === 'dev' ? process.env.PASALACKEN_TOKEN_DEV : process.env.PASALACKEN_TOKEN_PROD;

// Initiate the client with Riffy (needed for playing audio) and required intents for discord
const client = new Client({ intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.MessageContent
	] });
client.commands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.riffy = new Riffy(client, config.get('LAVALINK'), {
	send: (payload) => {
		const guild = client.guilds.cache.get(payload.d.guild_id);
		if (guild) guild.shard.send(payload);
	},
	defaultSearchPlatform: 'ytsearch',
	restVersion: 'v4'
});

module.exports = client;

// Init modular components
initEvents();
initCommands();
initButtons();
initModals();
initRiffy();

// Login
client.login(token).catch(err => {
	// Catch errors; sometimes problems occur, when replying to an interaction. They can be ignored
	if (err.name === 'InteractionNotReplied') {
		logger.warn('A event was not replied.');
		logger.log(err.stackTrace, colors.fg.crimson);
	}

	if (err.name === 'DiscordAPIError') {
		logger.warn('Discord threw an error. Probably an already answered event.');
		logger.log(err.stackTrace, colors.fg.crimson);
	}

	logger.warn(`${err} ${__filename}`);
	logger.log(err.stackTrace, colors.fg.crimson);
});

function initEvents() {
	// Init events
	logger.info('Initiating Events');

	// Get all event files
	const eventsPath = path.join(__dirname, '../events');
	const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

	// Initiate each file
	for (const file of eventFiles) {
		const filePath = path.join(eventsPath, file);
		const event = require(filePath);
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		} else {
			client.on(event.name, (...args) => event.execute(...args));
		}
		logger.info(`The event ${event.name} at ${filePath} was added.`);
	}

	logger.info('Events initiated');
}

function initCommands() {
	// Init commands
	logger.info('Initiating Commands');

	// Get all command files
	const commandsPath = path.join(__dirname, '../commands');
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	// Initiate each file
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
			logger.info(`The command at ${filePath} was added.`);
		} else {
			logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}

	logger.info('Commands initiated');
}

function initButtons() {
	// Init buttons
	logger.info('Initiating Buttons');

	// Get all button files
	const buttonsPath = path.join(__dirname, '../buttons');
	const buttonsFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));

	// Initiate each file
	for (const file of buttonsFiles) {
		const filePath = path.join(buttonsPath, file);
		const button = require(filePath);
		if ('data' in button && 'execute' in button) {
			client.buttons.set(button.data.data.custom_id, button);
			logger.info(`The button at ${filePath} was added.`);
		} else {
			logger.warn(`The button at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}

	logger.info('Buttons initiated');
}

function initModals() {
	// Init modals
	logger.info('Initiating Modals');

	// Get all modal files
	const modalsPath = path.join(__dirname, '../modals');
	const modalsFiles = fs.readdirSync(modalsPath).filter(file => file.endsWith('.js'));

	// Initiate each file
	for (const file of modalsFiles) {
		const filePath = path.join(modalsPath, file);
		const modal = require(filePath);
		if ('data' in modal && 'execute' in modal) {
			client.modals.set(modal.data.data.custom_id, modal);
			logger.info(`The modal at ${filePath} was added.`);
		} else {
			logger.warn(`The modal at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}

	logger.info('Modals initiated');
}

function initRiffy() {
	// Init riffy files
	logger.info('Initiating Riffy');

	// Get all riffy files
	const riffyPath = path.join(__dirname, '../riffy');

	for (const dir of fs.readdirSync(riffyPath)) {
		const lavalink = fs.readdirSync(`${riffyPath}/${dir}`).filter(file => file.endsWith('.js'));

		for (let file of lavalink) {
			let listener = require(`${riffyPath}/${dir}/${file}`);

			if (listener.name && typeof listener.name !== 'string') {
				logger.warn(`Couldn't load the riffy event ${file}, error: Property event should be string.`);
				continue;
			}

			listener.name = listener.name || file.replace('.js', '');

			logger.info(`[RIFFY] ${listener.name}`);
		}
	}

	logger.info('Riffy initiated');
}