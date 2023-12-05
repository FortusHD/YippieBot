// Imports
const { ActionRowBuilder, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const datetime = require('date-and-time');
const logger = require('../logging/logger.js');
const participateButton = require('../buttons/participateButton.js');
const jsonManager = require('../util/json_manager.js');
const config = require('config');
const { scheduleJob } = require('node-schedule');
require('dotenv').config();

// Add days to a date
function addDays(dateToAdd, days) {
	const date = dateToAdd;
	date.setDate(date.getDate() + days);
	return date;
}

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

// Starts the wichteln and matches all participants after a given time
module.exports = {
	data: new SlashCommandBuilder()
		.setName('wichteln')
		.setDescription('Startet das Wichteln')
		.setDMPermission(true)
		.addStringOption(option =>
			option
				.setName('wichtel-date')
				.setDescription('Datum und Uhrzeit an dem das Wichteln starten soll (DD.MM.YYYY, HH:mm)')
				.setRequired(true))
		.addIntegerOption(option =>
			option
				.setName('participating-time')
				.setDescription('Anzahl an Tagen, die Allen zum Teilnehmen zur Verfügung steht')
				.setRequired(true)),
	async execute(interaction) {
		logger.info(`${interaction.member.user.tag} started wichteln.`);

		const datetime_regex = '[0-3][0-9].[0-1][0-9].[0-9][0-9][0-9][0-9], [0-2][0-9]:[0-5][0-9]';

		await interaction.reply('Wichteln wird gestartet');

		// Only ADMIN is allowed to start wichteln
		if (interaction.user.id === config.get('ADMIN_USER_ID')) {
			const startTimeStr = interaction.options.getString('wichtel-date');
			const participatingTime = interaction.options.getInteger('participating-time');

			// Check if start time has correct form
			if (startTimeStr.match(datetime_regex)) {
				const wichtelChannel = interaction.client.guilds.cache.get(config.get('GUILD_ID')).channels.cache.get(config.get('WICHTEL_CHANNEL_ID'));

				// Check if channel does exist
				if (wichtelChannel) {
					// Reset
					await jsonManager.resetParticipants();

					// Build embed
					let participatingEnd = new Date();
					participatingEnd = addDays(participatingEnd, participatingTime);

					const row = new ActionRowBuilder()
						.addComponents(participateButton.data);

					const wichtelEmbed = new EmbedBuilder()
						.setColor(0xDB27B7)
						.setTitle('Wichteln')
						.setDescription(`Es ist wieder soweit. Wir schrottwichteln dieses Jahr wieder! Wir treffen uns am ${startTimeStr.split(', ')[0]} um ${startTimeStr.split(', ')[1]} Uhr. Ihr habt bis zum ${datetime.format(participatingEnd, 'DD.MM.YYYY')} um 23:59 Uhr Zeit um euch anzumelden. Dazu müsst ihr einfach nur den Knopf drücken!`);

					// Send Embed
					wichtelChannel.send({ embeds: [wichtelEmbed], components: [row] }).then(message => {
						jsonManager.updateMessageID('wichtel_id', message.id);
					}).catch(err => {
						logger.error(err, __filename);
					});

					await interaction.editReply('Das Wichteln wurde gestartet.');

					// Schedule job to delete message and match participants
					const date = new Date(new Date(participatingEnd.getFullYear(), participatingEnd.getMonth(), participatingEnd.getDate(), 23, 59, 59).toLocaleString('de-DE'));

					// Match participants after given time
					scheduleJob(date, function() {
						logger.info(`Ending Wichteln at ${new Date().toString()}`);

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
											.setDescription(`Hallo,\ndein Wichtel-Partner ist\n${match[1].dcName} (Steam: ${match[1].steamName})\nÜberlege dir ein schönes Spiel für deinen Partner und kaufe es auf Steam und lege es als Geschenk für den ${startTimeStr.split(', ')[0]} um ${startTimeStr.split(', ')[1]} Uhr oder früher fest.`);

										logger.info(`Sending ${match[0].dcName} their partner ${match[1].dcName}.`);

										user.send({ embeds: [matchEmbed] });
									});
								}
							} else {
								logger.info('Not enough participants for wichteln');
							}

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
						});
					});
				} else {
					logger.info(`The wichtel-channel with id ${config.get('WICHTEL_CHANNEL_ID')} could not be found.`);
					await interaction.editReply({ content: 'Der Wichtel-Channel konnte nicht gefunden werden!', ephemeral: true });
				}
			} else {
				logger.info(`${interaction.member.user.tag} entered a datetime with wrong regex.`);
				await interaction.editReply({ content: 'Du hast das "wichtel-date" falsch angegeben!', ephemeral: true });
			}
		} else {
			logger.info(`${interaction.member.user.tag} does not have permission.`);
			await interaction.editReply({ content: 'Dazu hast du keine Berechtigung!', ephemeral: true });
		}
	},
};