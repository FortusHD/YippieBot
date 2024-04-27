// Imports
const { Events, EmbedBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const jsonManager = require('../util/json_manager.js');
const config = require('config');

// Gets handled after bot login is completed
module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		logger.info(`Ready! Logged in as ${client.user.tag}`);

		// Sending reaction role message if this message does not exist
		const guild = client.guilds.cache.get(config.get('GUILD_ID'));
		const roleChannel = await guild.channels.cache.get(config.get('ROLE_CHANNEL_ID'));

		// Message data
		const title = 'Lustige Rollen';
		const color = 0x22E5AA;
		const fields = [
			{
				inline: false,
				name: `${guild.emojis.cache.find(emoji => emoji.name === 'schanze')} Drachi`,
				value: 'Damit erhältst du Zugang zur Drachenschanze',
			},
			{
				inline: false,
				name: `${guild.emojis.cache.find(emoji => emoji.name === 'free')} Gratis ist der Beste Preis`,
				value: 'Damit wirst du immer informiert, wenn es was gratis zu holen gibt',
			},
			{
				inline: false,
				name: `${guild.emojis.cache.find(emoji => emoji.name === 'nsfw')} NSFW`,
				value: 'Damit gönnst du dir Zugang zum **babes**-Channel. Viel Spaß :wink:',
			},
		];

		// Reactions
		const reactions = [
			config.get('DRACHI_EMOJI_ID'),
			config.get('FREE_EMOJI_ID'),
			config.get('NSFW_EMOJI_ID'),
		];

		// Build message
		const reactionEmbed = new EmbedBuilder()
			.setColor(color)
			.setTitle(title)
			.addFields(fields);

		jsonManager.getMessageID('role_id').then(currentMessageID => {
			roleChannel.messages.fetch().then(async messages => {
				let message = messages.get(currentMessageID);

				if (messages.size === 0 || !message) {
					// Send and add reactions
					message = await roleChannel.send({ embeds: [reactionEmbed] });
					for (const reaction of reactions) {
						await message.react(reaction);
					}

					await jsonManager.updateMessageID('role_id', message.id);
				} else if (messages.size !== 0 && message) {
					// Check if message needs to be updated
					let change = false;

					const currentEmbed = message.embeds[0];

					if (currentEmbed.title !== title || currentEmbed.color !== color || currentEmbed.fields.length !== fields.length) {
						change = true;
					}

					for (let i = 0; i < currentEmbed.fields.length; i++) {
						if (currentEmbed.fields[i].name !== fields[i].name || currentEmbed.fields[i].value !== fields[i].value) {
							change = true;
							break;
						}
					}

					if (change) {
						// Update message
						message.edit({ embeds: [reactionEmbed] }).then(async () => {
							for (const reaction of reactions) {
								await message.react(reaction);
							}
							logger.info('Applied changes to reaction message');
						});
					}
				}
			});
		});
	},
};