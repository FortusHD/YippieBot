require('dotenv').config();
const config = require('config');

function buildCurrentSongPos(currentTime, duration) {
	const pos = Math.round((convertToSeconds(currentTime) / convertToSeconds(duration)) * 20);
	return '═'.repeat(pos) + '●' + '═'.repeat(20 - pos) + ` ${currentTime}/${duration}`;
}

function convertToSeconds(timeStr) {
	const timeParts = timeStr.split(':').map(Number);
	return timeParts.length === 3
		? timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]
		: timeParts[0] * 60 + timeParts[1];
}

function getPlaylist(playlistId) {
	return fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet%2Clocalizations&id=${playlistId}&fields=items(localizations%2Csnippet%2Flocalized%2Ftitle)&key=${process.env.GOOGLE_KEY}`)
		.then(response => response.json());
}

async function notifyAdminCookies(interaction) {
	const admin = await interaction.client.users.fetch(config.get('ADMIN_USER_ID'))

	if (!admin.dmChannel) {
		await admin.createDM()
	}

	await admin.dmChannel.send("Die Cookies für den Musik-Bot könnten ausgelaufen sein!");
}

module.exports = { buildCurrentSongPos, getPlaylist, notifyAdminCookies };