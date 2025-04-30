// Imports
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
    pos > 20 ? pos = 20 : pos;
    return `${'═'.repeat(pos) }●${ '═'.repeat(20 - pos) } ${formatDuration(currentTime / 1000)}/`
		+ `${formatDuration(duration / 1000)}`;
}

/**
 * Convert a time string formatted as "HH:MM:SS" into the total number of seconds.
 *
 * @param {string} timeString The time string to convert (format: "HH:MM:SS").
 * @returns {number} The total number of seconds represented by the input time string.
 */
function getTimeInSeconds(timeString) {
    const timeParts = timeString.split(':').reverse();
    let totalSeconds = 0;

    if (timeParts.length >= 1) {
        totalSeconds += parseInt(timeParts[0]); // seconds
    }
    if (timeParts.length >= 2) {
        totalSeconds += parseInt(timeParts[1]) * 60; // minutes to seconds
    }
    if (timeParts.length >= 3) {
        totalSeconds += parseInt(timeParts[2]) * 3600; // hours to seconds
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

module.exports = {
    buildEmbed,
    buildCurrentSongPos,
    formatDuration,
    getTimeInSeconds,
    getPlaylist,
    notifyAdminCookies,
    editInteractionReply,
    getRandomColor,
    extractQueuePage,
};
