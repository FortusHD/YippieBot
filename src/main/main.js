// Imports
const fs = require('node:fs');
const path = require('node:path');
const logger = require('../logging/logger.js');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { YouTubePlugin } = require('@distube/youtube');
const { colors } = require('../logging/logger');
const { getVersion } = require('../util/readVersion');
require('dotenv').config();

logger.info('Starting Yippie-Bot');
logger.info(`Running on version: ${getVersion()}`);

// Constants
// Bot Token from env
const token = process.env.APP_ENV === 'dev' ? process.env.PASALACKEN_TOKEN_DEV : process.env.PASALACKEN_TOKEN_PROD;
// Path to the cookies for YouTube
const cookies_path = path.join(__dirname, '../../data/cookies.json');

// Initiate client with distube (needed for playing audio) and required intents for discord
const client = new Client({ intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.MessageContent
	] });
client.commands = new Collection();
client.buttons = new Collection();
client.distube = new DisTube(client, {
	emitNewSongOnly: true,
	emitAddSongWhenCreatingQueue: false,
	emitAddListWhenCreatingQueue: false,
	plugins: [
		new YouTubePlugin({ cookies: JSON.parse(fs.readFileSync(cookies_path)) }),
		new SpotifyPlugin()
	],
});

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

// Init buttons
logger.info('Initiating Buttons');

// Get all button files
const buttonsPath = path.join(__dirname, '../buttons');
const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));

// Initiate each file
for (const file of buttonFiles) {
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

// Login
client.login(token).catch(err => {
	if (err.name === 'InteractionNotReplied') {
		logger.warn('A event was not replied.');
		logger.log(err.stackTrace, colors.fg.crimson);
	}

	if (err.name === 'DiscordAPIError') {
		logger.warn('Discord threw an error. Probably an already answered event.');
		logger.log(err.stackTrace, colors.fg.crimson);
	}

	logger.warn(err, __filename);
	logger.log(err.stackTrace, colors.fg.crimson);
});