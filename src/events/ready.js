// Imports
const { Events, EmbedBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const jsonManager = require('../util/json_manager.js');

// Gets handled after bot login is completed
module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		logger.info(`Ready! Logged in as ${client.user.tag}`);

		// Sending reaction role message if this message does not exist
		const guild = client.guilds.cache.get('1141337940539232346');
		const roleChannel = await guild.channels.cache.get('1175161953036009573');

		jsonManager.getMessageID().then(currentMessageID => {
			roleChannel.messages.fetch().then(async messages => {
				if (messages.size === 0 || !messages.get(currentMessageID)) {
					// Build message
					const reactionEmbed = new EmbedBuilder()
						.setColor(0x22E5AA)
						.setTitle('Lustige Rollen')
						.addFields([
							{
								inline: false,
								name: `${guild.emojis.cache.find(emoji => emoji.name === 'schanze')} Drachi`,
								value: 'Damit erhältst du zugang zur Drachenschanze',
							},
							{
								inline: false,
								name: `${guild.emojis.cache.find(emoji => emoji.name === 'free')} Gratis ist der Beste Preis`,
								value: 'Damit wirst du immer informiert, wenn es was gratis zu holen gibt',
							},
						]);

					// Send and add reactions
					const message = await roleChannel.send({ embeds: [reactionEmbed] });
					await message.react('1175173441989656626');
					await message.react('1175176401532485662');

					await jsonManager.updateMessageID(message.id);
				}
			});
		});
	},
};