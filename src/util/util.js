// Imports
const fs = require('fs');
const path = require('path');
const config = require('./config');
const logger = require('../logging/logger');
const { EmbedBuilder } = require('discord.js');

/**
 * Builds and returns an Embed object based on the provided data.
 *
 * @param {Object} data - The data object used to configure the embed builder.
 * @param {string} data.color - The color of the embed.
 * @param {string} data.title - The title of the embed.
 * @param {string} data.description - The description of the embed.
 * @param {Array | undefined} data.fields - The fields to include in the embed.
 * @param {string | undefined} data.thumbnail - The URL of the embed's thumbnail image.
 * @param {string | undefined} data.image - The URL of the embed's main image.
 * @param {Object | undefined} data.footer - The footer configuration for the embed.
 * @param {string} data.origin -  The command which was used, to display in the footer.
 * @param {string} data.footer.text - Additional text to append to the footer.
 * @param {string | undefined} data.footer.iconURL - The URL of the footer's icon image.
 * @return {EmbedBuilder} A configured EmbedBuilder instance.
 */
function buildEmbed(data) {
    const footerText = `/${data.origin}${ data.footer?.text ? ` ${data.footer.text}` : ''}`;

    const embed = new EmbedBuilder()
        .setColor(data.color)
        .setTitle(data.title)
        .setDescription(data.description)
        .setTimestamp()
        .setFooter({ text: footerText, iconURL: data.footer?.iconURL });

    if (data.fields) {
        embed.setFields(data.fields);
    }
    if (data.thumbnail) {
        embed.setThumbnail(data.thumbnail);
    }
    if (data.image) {
        embed.setImage(data.image);
    }

    return embed;
}

/**
 * Builds and returns an embed object with the specified color, title, and fields.
 *
 * @param {string} color - The color of the embed in a valid color format (e.g., HEX or predefined color constants).
 * @param {string} title - The title of the embed.
 * @param {Array<Object>} fields - An array of field objects, where each field contains a name and value property
 * for the embed content.
 * @return {EmbedBuilder} The constructed EmbedBuilder object with the provided properties.
 */
function buildRoleEmbed(color, title, fields) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setFields(fields);
}

/**
 * Constructs and returns an Embed formatted for error messages.
 *
 * @param {string} errorMessage - The error message to be displayed in the embed description.
 * @param {Array<Object>} fields - An array of field objects where each object contains field properties for the embed
 * (e.g., name and value).
 * @return {EmbedBuilder} An embed object configured with the provided error message and fields.
 */
function buildErrorEmbed(errorMessage, fields) {
    return new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('Error Alert')
        .setDescription(errorMessage)
        .setFields(fields);
}

/**
 * Converts a time duration in seconds to a formatted string in the format "minutes:seconds".
 *
 * @param {number} time - The duration in seconds to format.
 * @return {string} The formatted duration as a string in "minutes:seconds" format.
 */
function formatDuration(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes }:${ seconds < 10 ? '0' : '' }${seconds}`;
}

/**
 * Builds a string representation of the current position of a song in its duration.
 *
 * @param {number} currentTime - The current time of the song in seconds.
 * @param {number} duration - The total duration of the song in seconds.
 * @return {string} A string representing the song's progress with a slider and formatted time display.
 */
function buildCurrentSongPos(currentTime, duration) {
    let pos = Math.round((currentTime / duration) * 20);
    pos = pos > 20 ? 20 : pos;
    return `${'═'.repeat(pos) }●${ '═'.repeat(20 - pos) } ${formatDuration(currentTime / 1000)}/`
		+ `${formatDuration(duration / 1000)}`;
}

/**
 * Converts a time string in the format "HH:MM:SS", "MM:SS", or "SS" to seconds.
 *
 * @param {string} timeString - The time string to convert (e.g., "1:30" for 1 minute and 30 seconds)
 * @returns {number} The total time in seconds, or 0 if the format is invalid
 */
function getTimeInSeconds(timeString) {
    const timeParts = timeString.split(':');
    // Validate format: max 3 parts (HH:MM:SS) and each part must be 1-2 digits
    if (timeParts.length > 3 || !/^(?:\d{1,2}:)*\d{2}$/.test(timeString)) {
        return 0;
    }

    let totalSeconds = 0;
    let multiplier = 1;
    // Process from right to left: seconds, then minutes, then hours
    for (let i = timeParts.length - 1; i >= 0; i--) {
        totalSeconds += parseInt(timeParts[i]) * multiplier;
        multiplier *= 60;
    }

    return totalSeconds;
}

/**
 * Fetches a playlist from the YouTube API based on the provided playlist ID.
 *
 * @param {string} playlistId - The unique identifier of the YouTube playlist to fetch.
 * @return {Promise<Object>} A promise that resolves to the playlist data as a JSON object.
 */
function getPlaylist(playlistId) {
    const url = config.getYoutubeApiUrl('playlist', {
        id: playlistId,
        key: config.getEnv('GOOGLE_KEY'),
    });
    return fetch(url).then(response => response.json());
}

/**
 * Notifies the admin about potential issues with cookies for the music bot.
 *
 * @param {ChatInputCommandInteraction} interaction - The interaction triggering the method.
 * @return {Promise<void>} - A Promise that resolves once the notification is sent.
 */
async function notifyAdminCookies(interaction) {
    const admin = await interaction.client.users.fetch(config.getAdminUserId());

    if (!admin.dmChannel) {
        await admin.createDM();
    }

    await admin.dmChannel.send(config.getAdminCookieNotificationMessage());
}

/**
 * Edits a reply for an interaction. If the interaction has no reply, or discord fucks up again, a new message is sent
 * instead.
 *
 * @param {ChatInputCommandInteraction} interaction the interaction to edit the reply for
 * @param {Object | String} options the new options for the reply
 * @returns {Promise<void>} a promise that resolves when the reply is successfully edited or sent
 */
async function editInteractionReply(interaction,
    options) {
    try {
        await interaction.editReply(options);
    } catch (error) {
        logger.warn(`Could not edit reply of interaction, sending message to channel. Error information:
		${error}`);
        await interaction.channel.send(options);
    }
}

/**
 * Generates a random hexadecimal color code.
 *
 * @return {string} A string representing a randomly generated color in hexadecimal format (e.g., "#A1B2C3").
 */
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/**
 * Extracts the queue page number from the provided string.
 *
 * @param {string} str - The input string from which the queue page number is to be extracted.
 * @returns {number|null} - The extracted queue page number if found in the input string, otherwise null.
 */
function extractQueuePage(str) {
    const match = str.match(/\d+/);
    return match ? parseInt(match[0]) : null;
}

/**
 * Initializes components by loading files from a directory and registering them with the client.
 *
 * @param {Client} client - The Discord client instance
 * @param {string} componentType - The type of component to initialize (e.g., 'commands', 'events')
 * @param {string} dirPath - The directory path where the component files are located
 * @param {Function} registerFn - Function to register each component with the client
 * @param {Function} validateFn - Function to validate each component before registration
 * @return {number} The number of components successfully loaded
 */
function initializeComponents(client, componentType, dirPath, registerFn, validateFn) {
    logger.info(`Initiating ${componentType}`);

    const componentFiles = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));
    let loadedCount = 0;

    for (const file of componentFiles) {
        const filePath = path.join(dirPath, file);
        const component = require(filePath);

        if (validateFn(component)) {
            registerFn(client, component, file);
            logger.info(`The ${componentType.slice(0, -1)} at ${filePath} was added.`);
            loadedCount++;
        } else {
            logger.warn(`The ${componentType.slice(0, -1)} at ${filePath} is missing required properties.`);
        }
    }

    logger.info(`${componentType} initiated`);
    return loadedCount;
}

/**
 * Shuffles the elements of an array randomly.
 *
 * @param {Array} array - The array to be shuffled
 * @return {Array} The shuffled array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Creates or gets a music player for a guild, handling connection logic.
 *
 * @param {Client} client - The Discord client
 * @param {Interaction} interaction - The interaction that triggered the command
 * @param {boolean} forceNew - Whether to force creation of a new player
 * @return {Object|null} The player object or null if Lavalink is not connected
 */
function getOrCreatePlayer(client, interaction, forceNew = false) {
    if (!client.riffy.nodeMap.get(config.getLavalinkConfig().host).connected) {
        logger.warn('Lavalink is not connected.');
        return null;
    }

    const guildId = interaction.guildId;
    const voiceChannel = interaction.member.voice.channel;
    let player = client.riffy.players.get(guildId);

    if (forceNew || !player) {
        player = client.riffy.createConnection({
            guildId: guildId,
            voiceChannel: voiceChannel.id,
            textChannel: interaction.channel.id,
            deaf: config.getDeafenInVoiceChannel(),
        });
    } else if (!player.voiceChannel || player.voiceChannel === '' || (player.playing && player.current === null)) {
        logger.info(`Joining ${voiceChannel.name}.`);
        player.destroy();
        player = client.riffy.createConnection({
            guildId: guildId,
            voiceChannel: voiceChannel.id,
            textChannel: interaction.channel.id,
            deaf: config.getDeafenInVoiceChannel(),
        });
    }

    return player;
}

/**
 * Validates that a user is in the same voice channel as the bot.
 *
 * @param {Interaction} interaction - The interaction that triggered the command
 * @param {Object} player - The music player
 * @return {boolean} True if the user is in the same voice channel, false otherwise
 */
function validateUserInSameVoiceChannel(interaction, player) {
    const voiceChannel = interaction.member.voice.channel;
    return player.voiceChannel === voiceChannel?.id?.toString();
}

module.exports = {
    buildEmbed,
    buildRoleEmbed,
    buildErrorEmbed,
    buildCurrentSongPos,
    formatDuration,
    getTimeInSeconds,
    getPlaylist,
    notifyAdminCookies,
    editInteractionReply,
    getRandomColor,
    extractQueuePage,
    initializeComponents,
    shuffleArray,
    getOrCreatePlayer,
    validateUserInSameVoiceChannel,
};
