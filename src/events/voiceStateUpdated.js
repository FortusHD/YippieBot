// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const data = require('../util/data.js');
const config = require('config');

// Handles any change in a voice state (User connects, disconnects, changes channel, ...)
module.exports = {
	name: Events.VoiceStateUpdate,
	execute(oldState, newState) {
		// Check if prisoner needs to be moved
		if (newState) {
			const member = newState.member;
			if (newState && data.isPrisoner(member.id) && newState.channelId !== config.get('AFK_CHANNEL_ID')) {
				const afkChannel = newState.guild.channels.cache
					.find(channel => channel.id === config.get('AFK_CHANNEL_ID'));

				if (afkChannel) {
					newState.member.voice.setChannel(afkChannel).then(() => {
						logger.info(`Moved ${member.nickname 
							? member.nickname 
							: member.user.username} 
							into the prison.`);
					});
				}
			}
		}

		// Check if music bot can disconnect (an empty channel)
		if (oldState) {
			const channelId = oldState.channelId;
			const ownVoiceId = oldState.client.distube.voices.get(oldState.guild)
				? oldState.client.distube.voices.get(oldState.guild).channelId
				: '';

			if (ownVoiceId === channelId && oldState.channel.members.size <= 1) {
				logger.info(`Leaving ${oldState.channel.name}, because no one's in there.`);

				const queue = oldState.client.distube.getQueue(oldState.guild);

				if (queue) {
					queue.stop().then(() => {
						logger.info('Queue stopped.');
					});
				}

				oldState.client.distube.voices.leave(oldState.guild);
			}
		}
	},
};