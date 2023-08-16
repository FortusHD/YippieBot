const GUILD_ID = '1141337940539232346';
const AFK_CHANNEL_ID = '1141340920533500005';
const BOT_NEWS_ID = '1141340729185153104';
const ADMIN_USER_ID = '279242313241329664';

let prisoners = [];

function addPrisoner(id) {
	prisoners.push(id);
}

function removePrisoner(id) {
	prisoners = prisoners.filter(function(value) {
		return value !== id;
	});
}

function isPrisoner(id) {
	return prisoners.includes(id);
}

module.exports = { GUILD_ID, AFK_CHANNEL_ID, BOT_NEWS_ID, ADMIN_USER_ID, addPrisoner, removePrisoner, isPrisoner };