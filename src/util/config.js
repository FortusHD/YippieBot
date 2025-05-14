/**
 * Configuration module for the Yippie-Bot.
 * This module provides a clean API for accessing configuration values.
 *
 * @module config
 */

const config = require('config');
require('dotenv').config();

/**
 * Get a Discord-related configuration value.
 *
 * @param {string} key - The key of the configuration value to get.
 * @param {string} [subKey] - Optional subkey for nested configuration values.
 * @returns {*} The configuration value.
 */
function getDiscord(key, subKey) {
    return config.get(`discord.${key}.${subKey}`);
}

/**
 * Get an API-related configuration value.
 *
 * @param {string} api - The API name.
 * @param {string} key - The key of the configuration value to get.
 * @returns {*} The configuration value.
 */
function getApi(api, key) {
    return config.get(`api.${api}.${key}`);
}

/**
 * Get a UI-related configuration value.
 *
 * @param {string} category - The UI category.
 * @param {string} key - The key of the configuration value to get.
 * @param {string} [subKey] - Optional subkey for nested configuration values.
 * @returns {*} The configuration value.
 */
function getUi(category, key, subKey) {
    return config.get(`ui.${category}.${key}.${subKey}`);
}

/**
 * Get an environment variable.
 *
 * @param {string} key - The key of the environment variable to get.
 * @param {*} [defaultValue] - Optional default value if the environment variable is not set.
 * @returns {string} The environment variable value or the default value.
 */
function getEnv(key, defaultValue) {
    return process.env[key] || defaultValue;
}

/**
 * Get the YouTube API URL for a specific endpoint with parameters.
 *
 * @param {string} endpoint - The endpoint to use.
 * @param {Object} params - The parameters to include in the URL.
 * @returns {string} The complete YouTube API URL.
 */
function getYoutubeApiUrl(endpoint, params) {
    const baseUrl = getApi('youtube', 'baseUrl');
    const endpointPath = getApi('youtube', `${endpoint }Endpoint`);
    const defaultParams = getApi('youtube', `${endpoint }Params`);

    let url = `${baseUrl}${endpointPath}?${defaultParams}`;

    // Add additional parameters
    for (const [key, value] of Object.entries(params)) {
        url += `&${key}=${value}`;
    }

    return url;
}

/**
 * Get the Lavalink configuration object.
 *
 * @returns {Object} The Lavalink configuration object.
 */
function getLavalinkConfig() {
    return {
        host: getEnv('LAVALINK_HOST', 'localhost'),
        port: parseInt(getEnv('LAVALINK_PORT', '2333')),
        password: getEnv('LAVALINK_PW', ''),
        secure: getEnv('LAVALINK_SECURE', 'false') === 'true',
    };
}

function getLavalinkSearch() {
    return config.get('lavalink.defaultSearchPlatform') || 'ytsearch';
}

function getLavalinkRest() {
    return config.get('lavalink.restVersion') || 'v4';
}

/**
 * Format a message by replacing placeholders with actual values.
 *
 * @param {string} message - The message to format.
 * @param {Object} values - The values to replace placeholders with.
 * @returns {string} The formatted message.
 */
function formatMessage(message, values) {
    let formattedMessage = message;
    for (const [key, value] of Object.entries(values)) {
        formattedMessage = formattedMessage.replace(`{${key}}`, value);
    }
    return formattedMessage;
}

/**
 * Get the Lavalink not connected message with the admin user ID.
 *
 * @returns {string} The formatted message.
 */
function getLavalinkNotConnectedMessage() {
    const message = getUi('embeds', 'messages', 'lavalinkNotConnected');
    return formatMessage(message, { adminUserId: getDiscord('users', 'admin')() });
}

function getHttpPort() {
    return config.get('http.port') || 7635;
}

module.exports = {
    getEnv,
    getYoutubeApiUrl,
    getLavalinkConfig,
    getLavalinkSearch,
    getLavalinkRest,

    // Convenience methods for commonly used configuration values
    getGuildId: () => getDiscord('guild', 'id'),
    getAdminUserId: () => getDiscord('users', 'admin'),
    getAfkChannelId: () => getDiscord('channels', 'afk'),
    getWichtelChannelId: () => getDiscord('channels', 'wichtel'),
    getRoleChannelId: () => getDiscord('channels', 'role'),
    getBobbyChannelId: () => getDiscord('channels', 'bobby'),
    getDrachiRoleId: () => getDiscord('roles', 'drachi'),
    getFreeRoleId: () => getDiscord('roles', 'free'),
    getNsfwRoleId: () => getDiscord('roles', 'nsfw'),
    getBobbyRoleId: () => getDiscord('roles', 'bobby'),
    getDrachiEmojiId: () => getDiscord('emojis', 'drachi'),
    getFreeEmojiId: () => getDiscord('emojis', 'free'),
    getNsfwEmojiId: () => getDiscord('emojis', 'nsfw'),
    getBobbyEmojiId: () => getDiscord('emojis', 'bobby'),
    getDeafenInVoiceChannel: () => getDiscord('bot', 'deafenInVoiceChannel'),
    getPlaylistAddedTitle: () => getUi('embeds', 'titles', 'playlistAdded'),
    getSongAddedTitle: () => getUi('embeds', 'titles', 'songAdded'),
    getAdminCookieNotificationMessage: () => getUi('embeds', 'messages', 'adminCookieNotification'),
    getLavalinkNotConnectedMessage,
    getHttpPort,
};
