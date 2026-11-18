// Imports
const logger = require('../logging/logger');
const config = require('./config');

/**
 * Returns the id of the role that belongs to the given emoji of the reaction role message.
 *
 * @param {string|null} emojiId - The id of the emoji of the reaction.
 * @return {string|null} The id of the role, or null if the emoji has no role.
 */
function getReactionRoleId(emojiId) {
    if (!emojiId) {
        return null;
    }

    const pairs = [
        [config.getDrachiEmojiId(), config.getDrachiRoleId()],
        [config.getFreeEmojiId(), config.getFreeRoleId()],
        [config.getNsfwEmojiId(), config.getNsfwRoleId()],
        [config.getBobbyEmojiId(), config.getBobbyRoleId()],
        [config.getStreetFighterEmojiId(), config.getStreetFighterRoleId()],
    ];

    const pair = pairs.find(([emoji]) => emoji && emoji === emojiId);
    return pair ? pair[1] : null;
}

/**
 * Adds or removes the role belonging to the emoji of a reaction. Errors (e.g. a missing member or missing
 * permissions) are logged and never thrown.
 *
 * @param {import(discord.js).MessageReaction} reaction - The reaction that was added or removed.
 * @param {import(discord.js).User} user - The user who added or removed the reaction.
 * @param {boolean} add - True to add the role, false to remove it.
 * @return {Promise<void>} A promise that resolves when the role was updated.
 */
async function updateReactionRole(reaction, user, add) {
    const roleId = getReactionRoleId(reaction.emoji.id);
    if (!roleId) {
        return;
    }

    const guild = reaction.message.guild;
    const role = guild.roles.cache.get(roleId);

    if (!role) {
        logger.warn(`Could not find the reaction role with id ${roleId}.`, __filename);
        return;
    }

    try {
        // The member is not necessarily cached (e.g. after a restart), so it is fetched if needed
        const member = guild.members.cache.get(user.id) ?? await guild.members.fetch(user.id);

        if (add) {
            await member.roles.add(role);
            logger.info(`Gave "${user.username}" the "${role.name}" role`);
        } else {
            await member.roles.remove(role);
            logger.info(`Removed the "${role.name}" role from "${user.username}"`);
        }
    } catch (error) {
        logger.warn(`Could not ${add ? 'give' : 'remove'} the "${role.name}" role ${add ? 'to' : 'from'} `
            + `"${user.username}": ${error}`, __filename);
    }
}

module.exports = { getReactionRoleId, updateReactionRole };
