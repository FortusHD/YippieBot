// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const { getId } = require('../database/tables/messageIDs');
const { getPoll } = require('../database/tables/polls');
const { updateReactionRole } = require('../util/reactionRoles');

/**
 * Counts how many different reactions of a message were given by a user.
 * The users of every reaction are fetched first, because the cache only contains the reactions that were seen since
 * the bot started (e.g. votes given before a restart would be missing).
 *
 * @param {import(discord.js).Message} message - The message with the reactions.
 * @param {string} userId - The id of the user.
 * @return {Promise<number>} The number of reactions of the user.
 */
async function countUserReactions(message, userId) {
    const reactions = [...message.reactions.cache.values()];

    await Promise.all(reactions.map(r => r.users.fetch().catch(error => {
        logger.warn(`Could not fetch the users of a reaction: ${error}`, __filename);
    })));

    return reactions.filter(r => r.users.cache.has(userId)).length;
}

// Handles an added reaction to a message
module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        // Reaction role message
        const currentMessageID = await getId('roleId');

        if (reaction.message.id === currentMessageID) {
            logger.debug(`Reaction added by "${user.tag}" to reaction message with id "${reaction.message.id}"`,
                __filename);

            await updateReactionRole(reaction, user, true);
        }

        // Active polls
        const poll = await getPoll(reaction.message.id);

        if (poll !== null && poll.maxVotes !== null && user.bot === false) {
            logger.debug(`Reaction added by "${user.tag}" to poll message with id "${reaction.message.id}"`,
                __filename);

            try {
                const channel = reaction.client.channels.cache.get(reaction.message.channelId);
                const message = await channel.messages.fetch(reaction.message.id);

                if (await countUserReactions(message, user.id) > poll.maxVotes) {
                    // Remove reaction if the user has reached max votes
                    await reaction.users.remove(user.id);
                }
            } catch (error) {
                logger.warn(`Could not check the votes of "${user.tag}" for poll ${reaction.message.id}: ${error}`,
                    __filename);
            }
        }
    },
};
