// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const jsonManager = require('../util/json_manager.js');
const config = require('config');

// Handles an added reaction to a message
module.exports = {
	name: Events.MessageReactionAdd,
	async execute(reaction, user) {
		jsonManager.getMessageID('role_id').then(currentMessageID => {
			if (reaction.message.id === currentMessageID) {
				const member = reaction.message.guild.members.cache.get(user.id);

				if (reaction.emoji.id === config.get('DRACHI_EMOJI_ID')) {
					// Schanze
					const drachiRole = reaction.message.guild.roles.cache.get(config.get('DRACHI_ROLE_ID'));
					member.roles.add(drachiRole);
					logger.info(`Gave "${user.username}" the "${drachiRole.name}" role`);
				}
				if (reaction.emoji.id === config.get('FREE_EMOJI_ID')) {
					// Free
					const freeRole = reaction.message.guild.roles.cache.get(config.get('FREE_ROLE_ID'));
					member.roles.add(freeRole);
					logger.info(`Gave "${user.username}" the "${freeRole.name}" role`);
				}
			}
		});
	},
};