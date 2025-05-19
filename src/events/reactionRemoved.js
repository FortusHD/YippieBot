// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const jsonManager = require('../util/json_manager.js');
const config = require('../util/config');

// Handles a removed reaction to a message
module.exports = {
    name: Events.MessageReactionRemove,
    async execute(reaction, user) {
        const currentMessageID = jsonManager.getMessageID('roleId');

        if (reaction.message.id === currentMessageID) {
            logger.debug(`Reaction removed by "${user.tag}" from reaction message `
                    + `with id "${reaction.message.id}"`, __filename);

            const member = reaction.message.guild.members.cache.get(user.id);

            if (reaction.emoji.id === config.getDrachiEmojiId()) {
                // Schanze
                const drachiRole = reaction.message.guild.roles.cache.get(config.getDrachiRoleId());
                member.roles.remove(drachiRole);
                logger.info(`Removed the "${drachiRole.name}" role from "${user.username}"`);
            }
            if (reaction.emoji.id === config.getFreeEmojiId()) {
                // Free
                const freeRole = reaction.message.guild.roles.cache.get(config.getFreeRoleId());
                member.roles.remove(freeRole);
                logger.info(`Removed the "${freeRole.name}" role from "${user.username}"`);
            }
            if (reaction.emoji.id === config.getNsfwEmojiId()) {
                // NSFW (= Babes)
                const nsfwRole = reaction.message.guild.roles.cache.get(config.getNsfwRoleId());
                member.roles.remove(nsfwRole);
                logger.info(`Removed the "${nsfwRole.name}" role from "${user.username}"`);
            }
            if (reaction.emoji.id === config.getBobbyEmojiId()) {
                // Bobby
                const bobbyRole = reaction.message.guild.roles.cache.get(config.getBobbyRoleId());
                member.roles.remove(bobbyRole);
                logger.info(`Removed the "${bobbyRole.name}" role from "${user.username}"`);
            }
        }
    },
};