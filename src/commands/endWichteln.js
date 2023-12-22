// Starts the wichteln and matches all participants after a given time
const logger = require('../logging/logger');
const jsonManager = require('../util/json_manager');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const config = require('config');
const data = require('../util/data.js');

// Get a match for a participant
function matchParticipants(participants) {
	const matches = [];
	const matched = [];

	for (let i = 0; i < participants.length; i++) {
		const current = participants[i];
		const availablePartners = participants.filter(participant => participant !== current && !matched.includes(participant));
		if (availablePartners.length === 0) {
			return null;
		}
		const randomIndex = Math.floor(Math.random() * availablePartners.length);
		const randomPartner = availablePartners[randomIndex];
		matches.push([current, randomPartner]);
		matched.push(randomPartner);
	}

	return matches;
}

// End the wichteln and matches all participants after a given time
module.exports = {
	data: new SlashCommandBuilder()
		.setName('endwichteln')
		.setDescription('Beendet das Wichteln')
		.setDMPermission(true),
	async execute(interaction) {
		await interaction.reply({ content: 'Das wichteln wird beendet...', ephemeral: false });

		// Only ADMIN is allowed to start wichteln
		if (interaction.user.id === config.get('ADMIN_USER_ID')) {
			const wichtelChannel = interaction.client.guilds.cache.get(config.get('GUILD_ID')).channels.cache.get(config.get('WICHTEL_CHANNEL_ID'));

			if (wichtelChannel) {
				logger.info(`Ending Wichteln at ${new Date().toString()}`);

				// Delete message
				jsonManager.getMessageID('wichtel_id').then(currentMessageID => {
					wichtelChannel.messages.fetch().then(async messages => {
						if (messages.size !== 0 && messages.get(currentMessageID)) {
							messages.get(currentMessageID).delete().then(() => {
								logger.info('Deleted Wichtel message.');
							});
						}

						await jsonManager.updateMessageID('wichtel_id', '');
					});
				});

				jsonManager.getParticipants().then(participants => {
					if (participants.length > 1) {
						// Match participants
						let matches = null;

						while (matches == null) {
							matches = matchParticipants(participants);
						}

						// Send messages with partners
						for (let i = 0; i < matches.length; i++) {
							const match = matches[i];
							interaction.client.users.fetch(match[0].id).then(user => {
								const matchEmbed = new EmbedBuilder()
									.setColor(0xDB27B7)
									.setTitle('Wichtel-Post')
									.setDescription(`Hallo,\ndein Wichtel-Partner ist\n${match[1].dcName} (Steam: ${match[1].steamName})\nÜberlege dir ein schönes Spiel für deinen Partner und kaufe es auf Steam und lege es als Geschenk für den ${data.wichtelTime} oder früher fest.`);

								logger.info(`Sending ${match[0].dcName} their partner ${match[1].dcName}.`);

								user.send({ embeds: [matchEmbed] });
							});
						}
					} else {
						logger.info('Not enough participants for wichteln');
					}
				});

				await interaction.editReply({ content: 'Das Wichteln wurde beendet!', ephemeral: true });
			} else {
				logger.info(`The wichtel-channel with id ${config.get('WICHTEL_CHANNEL_ID')} could not be found.`);
				await interaction.editReply({ content: 'Der Wichtel-Channel konnte nicht gefunden werden!', ephemeral: true });
			}
		} else {
			logger.info(`${interaction.member.user.tag} does not have permission.`);
			await interaction.editReply({ content: 'Dazu hast du keine Berechtigung!', ephemeral: true });
		}
	},
};