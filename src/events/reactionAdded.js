// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const jsonManager = require('../util/json_manager.js');

// Handles an added reaction to a message
module.exports = {
	name: Events.MessageReactionAdd,
	async execute(reaction, user) {
		jsonManager.getMessageID().then(currentMessageID => {
			if (reaction.message.id === currentMessageID) {
				const member = reaction.message.guild.members.cache.get(user.id);

				if (reaction.emoji.id === '1175173441989656626') {
					// Schanze
					const drachiRole = reaction.message.guild.roles.cache.get('1141372038368477254');
					member.roles.add(drachiRole);
					logger.info(`Gave "${user.username}" the "${drachiRole.name}" role`);
				}
				if (reaction.emoji.id === '1175176401532485662') {
					// Free
					const freeRole = reaction.message.guild.roles.cache.get('1141364800828481677');
					member.roles.add(freeRole);
					logger.info(`Gave "${user.username}" the "${freeRole.name}" role`);
				}
			}
		});
	},
};