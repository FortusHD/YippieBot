// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const data = require('../util/data.js');
const { getAfkChannelId } = require('../util/config');

// Handles any change in a voice state (User connects, disconnects, changes channel, ...)
module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        // Check if a prisoner needs to be moved
        if (newState) {
            const member = newState.member;
            const afkChannelID = getAfkChannelId();
            if (data.isPrisoner(member.id) && newState.channelId !== afkChannelID) {
                const afkChannel = newState.guild.channels.cache
                    .find(channel => channel.id === afkChannelID);

                if (afkChannel) {
                    await newState.member.voice.setChannel(afkChannel);
                    logger.info(`Moved "${member.nickname ? member.nickname : member.user.tag}" into the prison.`);
                } else {
                    logger.warn(`Could not find AFK channel with id ${afkChannelID}, cannot move prisoner.`);
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

                if (player.disconnect) {
                    const disconnected = await player.disconnect();
                    if (disconnected?.destroy) {
                        await disconnected.destroy();
                    }
                }
            }
        }
    },
};