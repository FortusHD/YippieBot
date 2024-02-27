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

module.exports = { buildCurrentSongPos };