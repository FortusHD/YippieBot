// Imports
const { ActionRowBuilder, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const datetime = require('date-and-time');
const logger = require('../logging/logger.js');
const participateButton = require('../buttons/participateButton.js');
const jsonManager = require('../util/json_manager.js');
const config = require('config');
const data = require('../util/data.js');
const { editInteractionReply } = require('../util/util');
require('dotenv').config();

// Add days to a date
function addDays(dateToAdd, days) {
	const date = dateToAdd;
	date.setDate(date.getDate() + days);
	return date;
}

// Starts the wichteln
module.exports = {
	data: new SlashCommandBuilder()
		.setName('wichteln')
		.setDescription('Startet das Wichteln')
		.setContexts([1])
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
				const wichtelChannel = interaction.client.guilds.cache.get(config.get('GUILD_ID'))
					.channels.cache.get(config.get('WICHTEL_CHANNEL_ID'));

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
						.setDescription(`Es ist wieder so weit. Wir wichteln dieses Jahr wieder mit **Schrottspielen**! 
						Es geht also darum möglichst beschissene Spiele zu verschenken. 
						Wir treffen uns am ${startTimeStr.split(', ')[0]} um 
						${startTimeStr.split(', ')[1]} Uhr. Dann werden wir zusammen die Spiele 2 Stunden 
						lang spielen udn und gegenseitig beim Leiden zuschauen können. Wer an diesem Tag nicht kann, 
						muss sich keine Sorgen machen. Man kann das Spiel gerne auch zu einem anderen Zeitpunkt 
						spielen. Es macht aber am meisten SPaß, wenn die Person, die einem das SPiel geschenkt hat, 
						dabei ist. Ihr habt bis zum ${datetime.format(participatingEnd, 'DD.MM.YYYY')} 
						um 23:59 Uhr Zeit, um euch anzumelden. Dazu müsst ihr einfach nur den Knopf drücken!`);

					// Send Embed
					wichtelChannel.send({ embeds: [wichtelEmbed], components: [row] }).then(message => {
						jsonManager.updateMessageID('wichtel_id', message.id);
					}).catch(err => {
						logger.error(err, __filename);
					});

					await editInteractionReply(interaction, 'Das Wichteln wurde gestartet.');

					data.setWichtelTime(`${startTimeStr.split(', ')[0]} um 
					${startTimeStr.split(', ')[1]} Uhr`);
				} else {
					logger.info(`The wichtel-channel with id ${config.get('WICHTEL_CHANNEL_ID')} 
					could not be found.`);
					await editInteractionReply(interaction, {
						content: 'Der Wichtel-Channel konnte nicht gefunden werden!',
						ephemeral: true
					});
				}
			} else {
				logger.info(`${interaction.member.user.tag} entered a datetime with wrong regex.`);
				await editInteractionReply(interaction, {
					content: 'Du hast das "wichtel-date" falsch angegeben!',
					ephemeral: true
				});
			}
		} else {
			logger.info(`${interaction.member.user.tag} does not have permission.`);
			await editInteractionReply(interaction, {
				content: 'Dazu hast du keine Berechtigung!',
				ephemeral: true
			});
		}
	},
};