require('dotenv').config();
const config = require('config');
const logger = require('../logging/logger');

/**
 * Builds a string representing the current position of the song based on the current time and total duration.
 *
 * @param {string} currentTime - The current time of the song.
 * @param {string} duration - The total duration of the song.
 * @returns {string} - A string showing the current position of the song as a progress bar.
 */
function buildCurrentSongPos(currentTime, duration) {
	const pos = Math.round((convertToSeconds(currentTime) / convertToSeconds(duration)) * 20);
	return '═'.repeat(pos) + '●' + '═'.repeat(20 - pos) + ` ${currentTime}/${duration}`;
}

/**
 * Converts a time string in the format HH:MM:SS or MM:SS to seconds.
 *
 * @param {string} timeStr The time string to convert to seconds. Format should be HH:MM:SS or MM:SS.
 * @returns {number} The time in seconds based on the provided time string.
 */
function convertToSeconds(timeStr) {
	const timeParts = timeStr.split(':').map(Number);
	return timeParts.length === 3
		? timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]
		: timeParts[0] * 60 + timeParts[1];
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
	const admin = await interaction.client.users.fetch(config.get('ADMIN_USER_ID'))

	if (!admin.dmChannel) {
		await admin.createDM()
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
		${error}`)
		await interaction.channel.send(options);
	}
}

module.exports = { buildCurrentSongPos, getPlaylist, notifyAdminCookies, editInteractionReply };