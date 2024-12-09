// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const jsonManager = require('../util/json_manager.js');
const config = require('config');

// Handles an added reaction to a message
module.exports = {
	name: Events.MessageReactionAdd,
	async execute(reaction, user) {
		// Reaction role message
		const currentMessageID = jsonManager.getMessageID('role_id');

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
			if (reaction.emoji.id === config.get('NSFW_EMOJI_ID')) {
				// NSFW (= Babes)
				const nsfwRole = reaction.message.guild.roles.cache.get(config.get('NSFW_ROLE_ID'));
				member.roles.add(nsfwRole);
				logger.info(`Gave "${user.username}" the "${nsfwRole.name}" role`);
			}
			if (reaction.emoji.id === config.get('BOBBY_EMOJI_ID')) {
				// Bobby
				const bobbyRole = reaction.message.guild.roles.cache.get(config.get('BOBBY_ROLE_ID'));
				member.roles.add(bobbyRole);
				logger.info(`Gave "${user.username}" the "${bobbyRole.name}" role`);
			}
		}

		// Active polls
		const poll = jsonManager.getPoll(reaction.message.id);

		if (poll !== null && poll.max_votes !== null && user.bot === false) {
			reaction.client.channels.cache.get(reaction.message.channelId).messages.fetch(reaction.message.id)
				.then(async message => {
					const userReactions = message.reactions.cache.filter(r => r.users.cache.has(user.id));
					if (userReactions.size > poll.max_votes) {
						// Remove reaction if user has reached max votes
						await reaction.users.remove(user.id);
					}
				});
		}
	},
};