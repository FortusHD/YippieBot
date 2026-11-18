// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const { getId } = require('../database/tables/messageIDs');
const { updateReactionRole } = require('../util/reactionRoles');

// Handles a removed reaction to a message
module.exports = {
    name: Events.MessageReactionRemove,
    async execute(reaction, user) {
        const currentMessageID = await getId('roleId');

        if (reaction.message.id === currentMessageID) {
            logger.debug(`Reaction removed by "${user.tag}" from reaction message `
                    + `with id "${reaction.message.id}"`, __filename);

            await updateReactionRole(reaction, user, false);
        }
    },
};
