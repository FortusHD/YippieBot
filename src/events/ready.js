// Imports
const { Events, EmbedBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const jsonManager = require('../util/json_manager.js');
const config = require('../util/config');
const { startWichtelLoop } = require('../threads/wichtelLoop');
const { startPollLoop } = require('../threads/pollLoop');
const { getPolls } = require('../util/json_manager');
const { startLavalinkLoop } = require('../threads/lavalinkLoop');

// Gets handled after bot login is completed
module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		// Set up riffy
		client.riffy.init(client.user.id);

		logger.info(`Ready! Logged in as ${client.user.tag}`);

		// Sending a reaction role message if this message does not exist
		const guild = client.guilds.cache.get(config.getGuildId());
		const roleChannel = await guild.channels.cache.get(config.getRoleChannelId());

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
			{
				inline: false,
				name: `${guild.emojis.cache.find(emoji => emoji.name === 'rene')} Bobbys CS Videos`,
				value: 'Hiermit weißt du immer, wann Bobby wieder Mal eine neue Folge CS hochgeladen hat.',
			},
		];

		// Reactions
		const reactions = [
			config.getDrachiEmojiId(),
			config.getFreeEmojiId(),
			config.getNsfwEmojiId(),
			config.getBobbyEmojiId(),
		];

		// Build the message
		const reactionEmbed = new EmbedBuilder()
			.setColor(color)
			.setTitle(title)
			.addFields(fields);

		const currentMessageID = jsonManager.getMessageID('role_id');

		roleChannel.messages.fetch().then(async messages => {
			let message = messages.get(currentMessageID);

			if (messages.size === 0 || !message) {
				// Send and add reactions
				message = await roleChannel.send({ embeds: [reactionEmbed] });
				for (const reaction of reactions) {
					await message.react(reaction);
				}

				jsonManager.updateMessageID('role_id', message.id);
			} else if (messages.size !== 0 && message) {
				// Check if the message needs to be updated
				let change = false;

				const currentEmbed = message.embeds[0];

				if (currentEmbed.title !== title || currentEmbed.color !== color
					|| currentEmbed.fields.length !== fields.length) {
					change = true;
				}

				for (let i = 0; i < currentEmbed.fields.length; i++) {
					if (currentEmbed.fields[i].name !== fields[i].name
						|| currentEmbed.fields[i].value !== fields[i].value) {
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

		// Load all active poll messages into the cache
		for (const poll of getPolls()) {
			client.channels.fetch(poll.channelId).then(async channel => {
				await channel.messages.fetch(poll.messageId);
			});
		}

		// Start wichtelLoop if needed
		await startWichtelLoop(client);
		// Start pollLoop
		await startPollLoop(client);
		// Start lavalinkLoop
		await startLavalinkLoop(client);
	},
};