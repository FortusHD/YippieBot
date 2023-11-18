// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const jsonManager = require('../util/json_manager.js');

// Handles a removed reaction to a message
module.exports = {
	name: Events.MessageReactionRemove,
	async execute(reaction, user) {
		jsonManager.getMessageID().then(currentMessageID => {
			if (reaction.message.id === currentMessageID) {
				const member = reaction.message.guild.members.cache.get(user.id);

				if (reaction.emoji.id === '1175173441989656626') {
					// Schanze
					const drachiRole = reaction.message.guild.roles.cache.get('1141372038368477254');
					member.roles.remove(drachiRole);
					logger.info(`Removed the "${drachiRole.name}" role from "${user.username}"`);
				}
				if (reaction.emoji.id === '1175176401532485662') {
					// Free
					const freeRole = reaction.message.guild.roles.cache.get('1141364800828481677');
					member.roles.remove(freeRole);
					logger.info(`Removed the "${freeRole.name}" role from "${user.username}"`);
				}
			}
		});
	},
};