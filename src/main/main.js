/**
 * @fileoverview Main entry point for the Yippie-Bot Discord application.
 * This file initializes the Discord client, sets up all components (commands, events, buttons, modals),
 * configures the Riffy music player, and handles the bot's login process.
 *
 * @module main/main
 * @requires fs
 * @requires path
 * @requires ../logging/logger
 * @requires @discord.js
 * @requires ../util/readVersion
 * @requires riffy
 * @requires ./deployCommands
 * @requires ../migration/migration
 * @requires ../util/config
 * @requires ../logging/errorHandler
 */

// Imports
const fs = require('fs');
const path = require('path');
const logger = require('../logging/logger');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { getVersion } = require('../util/readVersion');
const { Riffy } = require('riffy');
const deploy = require('./deployCommands');
const config = require('../util/config');
const { handleError, ErrorType } = require('../logging/errorHandler');
const { initializeComponents } = require('../util/util');
const { start } = require('../health/healthEndpoint');
const { setup } = require('../database/database');

/**
 * Initializes and binds event handlers from the events directory to the provided client instance.
 *
 * @param {Client} client - The client instance to which the events will be bound.
 * @return {void} This function does not return a value.
 */
function initEvents(client) {
    const eventsPath = path.join(__dirname, '../events');
    initializeComponents(
        client,
        'Events',
        eventsPath,
        (client, event, _file) => {
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
            logger.info(`The event ${event.name} was added.`);
        },
        (event) => 'name' in event && 'execute' in event,
    );
}

/**
 * Initializes the commands for the client by loading all command files in the specified directory.
 * Each command file must export a `data` and an `execute` property.
 *
 * @param {Client} client - The client object used to store and manage commands.
 * @return {void} No return value.
 */
function initCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    initializeComponents(
        client,
        'Commands',
        commandsPath,
        (client, command) => client.commands.set(command.data.name, command),
        (command) => 'data' in command && 'execute' in command,
    );
}

/**
 * Initializes all the button components for the application.
 *
 * @param {Client} client - The client object that holds application data and methods.
 * @return {void} This function does not return a value.
 */
function initButtons(client) {
    const buttonsPath = path.join(__dirname, '../buttons');
    initializeComponents(
        client,
        'Buttons',
        buttonsPath,
        (client, button) => client.buttons.set(button.data.data.custom_id, button),
        (button) => 'data' in button && 'execute' in button,
    );
}

/**
 * Initializes modals by dynamically importing modal files, verifying their structure,
 * and registering them within the provided client's modal collection.
 *
 * @param {Client} client The client object that contains the modal collection where modals will be registered.
 * @return {void} Does not return any value.
 */
function initModals(client) {
    const modalsPath = path.join(__dirname, '../modals');
    initializeComponents(
        client,
        'Modals',
        modalsPath,
        (client, modal) => client.modals.set(modal.data.data.custom_id, modal),
        (modal) => 'data' in modal && 'execute' in modal,
    );
}

/**
 * Initializes the Riffy event listeners by loading and binding them to the provided client.
 *
 * @param {Client} client - The client object to which Riffy event listeners will be attached.
 * @return {void} This method does not return any value.
 */
function initRiffy(client) {
    // Init riffy files
    logger.info('Initiating Riffy');

    // Get all riffy files
    const riffyPath = path.join(__dirname, '../riffy');

    for (const dir of fs.readdirSync(riffyPath)) {
        const lavalink = fs.readdirSync(`${riffyPath}/${dir}`).filter(file => file.endsWith('.js'));

        for (const file of lavalink) {
            const listener = require(`${riffyPath}/${dir}/${file}`);

            if (listener.name && typeof listener.name !== 'string') {
                logger.warn(`Couldn't load the riffy event ${file}, error: Property event should be string.`);
                continue;
            }

            listener.name = listener.name || file.replace('.js', '');

            client.riffy.on(listener.name, listener.execute);

            logger.info(`[RIFFY] ${listener.name}`);
        }
    }

    logger.info('Riffy initiated');
}

logger.info('Starting Yippie-Bot');
logger.info(`Running on version: ${getVersion()}`);

// Register commands (to discord) on startup
if (config.getEnv('DEPLOY', 'false') === 'true') {
    logger.info('Deploying commands...');
    deploy().then((loadedCommands) => {
        if (loadedCommands > 0) {
            logger.info(`Successfully deployed ${loadedCommands} commands.`);
        } else {
            logger.warn('No commands were deployed.');
        }
    });
}

/**
 * Configuration and initialization section.
 * Sets up the bot token based on the environment, configures Lavalink for music functionality,
 * and initializes the Discord client with necessary intents and collections.
 */

// Constants
// Bot Token from env
const token = config.getEnv('APP_ENV', 'dev') === 'dev'
    ? config.getEnv('BOT_TOKEN_DEV')
    : config.getEnv('BOT_TOKEN_PROD');
// Load lavalink config
const lavalink = [config.getLavalinkConfig()];

logger.debug(`Using token: ${token.slice(0, 10) }...${ token.slice(-10)}`, __filename);
logger.debug(`Using lavalink config: ${JSON.stringify(lavalink)}`, __filename);

/**
 * The main Discord client instance for the bot.
 * Configured with the necessary intents to function properly.
 *
 * @type {Client}
 */
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
] });

/**
 * Collection to store all registered commands.
 * @type {Collection}
 */
client.commands = new Collection();

/**
 * Collection to store all registered button handlers.
 * @type {Collection}
 */
client.buttons = new Collection();

/**
 * Collection to store all registered modal handlers.
 * @type {Collection}
 */
client.modals = new Collection();

/**
 * Riffy instance for music playback functionality.
 * Configured with Lavalink settings from the config.
 *
 * @type {Riffy}
 */
client.riffy = new Riffy(client, lavalink, {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) {
            guild.shard.send(payload);
        }
    },
    defaultSearchPlatform: config.getLavalinkSearch(),
    restVersion: config.getLavalinkRest(),
});

// Store database and health endpoint setup functions for lazy loading
client.setupDatabase = setup;
client.startHealthEndpoint = start;

/**
 * Export the client instance for use in other parts of the application.
 * @type {Client}
 */
module.exports = client;

/**
 * Initialize all modular components of the bot.
 * This section calls the initialization functions to set up events, commands,
 * buttons, modals, and Riffy music functionality.
 *
 * Events are initialized first as they are critical for the bot to function.
 * Commands, buttons, and modals are initialized in parallel to improve startup time.
 */
initEvents(client);

// Initialize commands, buttons, and modals in parallel
Promise.all([
    new Promise(resolve => {
        initCommands(client);
        resolve();
    }),
    new Promise(resolve => {
        initButtons(client);
        resolve();
    }),
    new Promise(resolve => {
        initModals(client);
        resolve();
    }),
]).then(() => {
    logger.info('All Discord components initialized');
});

// Initialize Riffy
initRiffy(client);

/**
 * Log in to Discord with the configured token.
 * This section handles the login process and provides comprehensive error handling
 * for different types of errors that might occur during login or interaction.
 *
 * @fires import(discord.js).Client#ready When the client successfully connects to Discord
 * @listens process#unhandledRejection For any unhandled promise rejections
 */
client.login(token).catch(err => {
    // Handle different types of errors
    if (err.name === 'InteractionNotReplied') {
        handleError(err, __filename, {
            type: ErrorType.INTERACTION_ERROR,
            context: { message: 'A event was not replied' },
        });
    } else if (err.name === 'DiscordAPIError') {
        handleError(err, __filename, {
            type: ErrorType.DISCORD_API_ERROR,
            context: { message: 'Probably an already answered event' },
        });
    } else {
        handleError(err, __filename, {
            type: ErrorType.INTERNAL_ERROR,
            context: { message: 'Error during client login' },
        });
    }
});
