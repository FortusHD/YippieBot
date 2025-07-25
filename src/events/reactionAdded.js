// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const config = require('../util/config');
const { getId } = require('../database/tables/messageIDs');
const { getPoll } = require('../database/tables/polls');

// Handles an added reaction to a message
module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        // Reaction role message
        const currentMessageID = await getId('roleId');

        if (reaction.message.id === currentMessageID) {
            logger.debug(`Reaction added by "${user.tag}" to reaction message with id "${reaction.message.id}"`,
                __filename);

            const member = reaction.message.guild.members.cache.get(user.id);

            if (reaction.emoji.id === config.getDrachiEmojiId()) {
                // Schanze
                const drachiRole = reaction.message.guild.roles.cache.get(config.getDrachiRoleId());
                member.roles.add(drachiRole);
                logger.info(`Gave "${user.username}" the "${drachiRole.name}" role`);
            }
            if (reaction.emoji.id === config.getFreeEmojiId()) {
                // Free
                const freeRole = reaction.message.guild.roles.cache.get(config.getFreeRoleId());
                member.roles.add(freeRole);
                logger.info(`Gave "${user.username}" the "${freeRole.name}" role`);
            }
            if (reaction.emoji.id === config.getNsfwEmojiId()) {
                // NSFW (= Babes)
                const nsfwRole = reaction.message.guild.roles.cache.get(config.getNsfwRoleId());
                member.roles.add(nsfwRole);
                logger.info(`Gave "${user.username}" the "${nsfwRole.name}" role`);
            }
            if (reaction.emoji.id === config.getBobbyEmojiId()) {
                // Bobby
                const bobbyRole = reaction.message.guild.roles.cache.get(config.getBobbyRoleId());
                member.roles.add(bobbyRole);
                logger.info(`Gave "${user.username}" the "${bobbyRole.name}" role`);
            }
        }

        // Active polls
        const poll = await getPoll(reaction.message.id);

        if (poll !== null && poll.maxVotes !== null && user.bot === false) {
            logger.debug(`Reaction added by "${user.tag}" to poll message with id "${reaction.message.id}"`,
                __filename);

            reaction.client.channels.cache.get(reaction.message.channelId).messages.fetch(reaction.message.id)
                .then(async message => {
                    const userReactions = message.reactions.cache.filter(r => r.users.cache.has(user.id));
                    if (userReactions.size > poll.maxVotes) {
                        // Remove reaction if the user has reached max votes
                        await reaction.users.remove(user.id);
                    }
                });
        }
    },
};