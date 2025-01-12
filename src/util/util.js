require('dotenv').config();
const config = require('config');
const logger = require('../logging/logger');

/**
 * Builds a string representation of the current position of a song in its duration.
 *
 * @param {number} currentTime - The current time of the song in seconds.
 * @param {number} duration - The total duration of the song in seconds.
 * @return {string} A string representing the song's progress with a slider and formatted time display.
 */
function buildCurrentSongPos(currentTime, duration) {
	const pos = Math.round((currentTime / duration) * 20);
	return '═'.repeat(pos) + '●' + '═'.repeat(20 - pos) + ` ${formatDuration(currentTime / 1000)}/${formatDuration(duration / 1000)}`;
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
	return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

/**
 * Retrieves information about a specific playlist from YouTube API.
 *
 * @param {string} playlistId - The ID of the playlist to retrieve information for.
 * @returns {Promise<Object>} A Promise that resolves with the playlist information in JSON format.
 */
function getPlaylist(playlistId) {
	return fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet%2Clocalizations&id=${playlistId}
	&fields=items(localizations%2Csnippet%2Flocalized%2Ftitle)&key=${process.env.GOOGLE_KEY}`)
		.then(response => response.json());
}

/**
 * Notifies the admin about potential issues with cookies for the music bot.
 *
 * @param {ChatInputCommandInteraction} interaction - The interaction triggering the method.
 * @return {Promise<void>} - A Promise that resolves once the notification is sent.
 */
async function notifyAdminCookies(interaction) {
	const admin = await interaction.client.users.fetch(config.get('ADMIN_USER_ID'));

	if (!admin.dmChannel) {
		await admin.createDM();
	}

	await admin.dmChannel.send('Die Cookies für den Musik-Bot könnten ausgelaufen sein!');
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

module.exports = { buildCurrentSongPos, formatDuration, getPlaylist, notifyAdminCookies, editInteractionReply };