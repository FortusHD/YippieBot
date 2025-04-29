// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const data = require('../util/data.js');
const { getAfkChannelId } = require('../util/config');

// Handles any change in a voice state (User connects, disconnects, changes channel, ...)
module.exports = {
	name: Events.VoiceStateUpdate,
	execute(oldState, newState) {
		// Check if prisoner needs to be moved
		if (newState) {
			const member = newState.member;
			if (newState && data.isPrisoner(member.id) && newState.channelId !== getAfkChannelId()) {
				const afkChannel = newState.guild.channels.cache
					.find(channel => channel.id === getAfkChannelId());

				if (afkChannel) {
					newState.member.voice.setChannel(afkChannel).then(() => {
						logger.info(`Moved "${member.nickname ? member.nickname : member.user.username}" into the prison.`);
					});
				}
			}
		}

		// Check if music bot can disconnect (an empty channel)
		const client = newState ? newState.client : oldState.client;
		const player = client.riffy.players.get(oldState.guild.id);

		if (oldState && player) {
			const channelId = oldState.channelId;
			const ownVoiceId = player.voiceChannel;

			if (channelId && ownVoiceId === channelId.toString() && oldState.channel.members.size <= 1) {
				logger.info(`Leaving ${oldState.channel.name}, because no one's in there.`);

				player.disconnect().destroy();
			}
		}
	},
};