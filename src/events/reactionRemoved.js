// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const jsonManager = require('../util/json_manager.js');
const config = require('config');

// Handles a removed reaction to a message
module.exports = {
	name: Events.MessageReactionRemove,
	async execute(reaction, user) {
		const currentMessageID = jsonManager.getMessageID('role_id');

		if (reaction.message.id === currentMessageID) {
			const member = reaction.message.guild.members.cache.get(user.id);

			if (reaction.emoji.id === config.get('DRACHI_EMOJI_ID')) {
				// Schanze
				const drachiRole = reaction.message.guild.roles.cache.get(config.get('DRACHI_ROLE_ID'));
				member.roles.remove(drachiRole);
				logger.info(`Removed the "${drachiRole.name}" role from "${user.username}"`);
			}
			if (reaction.emoji.id === config.get('FREE_EMOJI_ID')) {
				// Free
				const freeRole = reaction.message.guild.roles.cache.get(config.get('FREE_ROLE_ID'));
				member.roles.remove(freeRole);
				logger.info(`Removed the "${freeRole.name}" role from "${user.username}"`);
			}
			if (reaction.emoji.id === config.get('NSFW_EMOJI_ID')) {
				// NSFW (= Babes)
				const nsfwRole = reaction.message.guild.roles.cache.get(config.get('NSFW_ROLE_ID'));
				member.roles.remove(nsfwRole);
				logger.info(`Removed the "${nsfwRole.name}" role from "${user.username}"`);
			}
			if (reaction.emoji.id === config.get('BOBBY_EMOJI_ID')) {
				// Bobby
				const bobbyRole = reaction.message.guild.roles.cache.get(config.get('BOBBY_ROLE_ID'));
				member.roles.remove(bobbyRole);
				logger.info(`Removed the "${bobbyRole.name}" role from "${user.username}"`);
			}
		}
	},
};