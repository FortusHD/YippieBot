// Imports
const { ActionRowBuilder, SlashCommandBuilder } = require('discord.js');
const datetime = require('date-and-time');
const logger = require('../logging/logger.js');
const participateButton = require('../buttons/participateButton.js');
const participantsButton = require('../buttons/participantsButton.js');
const jsonManager = require('../util/json_manager.js');
const config = require('config');
const { editInteractionReply, buildEmbed } = require('../util/util');
const { setWichtelData } = require('../util/json_manager');
const { startWichtelLoop } = require('../threads/wichtelLoop');
require('dotenv').config();

// Starts the wichteln
module.exports = {
	guild: true,
	dm: true,
	devOnly: true,
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
		logger.info(`Handling wichtel command used by "${interaction.user.tag}".`);

		await interaction.reply('Wichteln wird gestartet');

		const datetime_regex = '[0-3][0-9].[0-1][0-9].[0-9][0-9][0-9][0-9], [0-2][0-9]:[0-5][0-9]';
		const startTimeStr = interaction.options.getString('wichtel-date');
		const participatingTime = interaction.options.getInteger('participating-time');

		// Check if start time has the correct form
		if (startTimeStr.match(datetime_regex)) {
			const wichtelChannel = interaction.client.guilds.cache.get(config.get('GUILD_ID'))
				.channels.cache.get(config.get('WICHTEL_CHANNEL_ID'));

			// Check if the channel does exist
			if (wichtelChannel) {
				// Reset
				jsonManager.resetParticipants();

				// Generate end time (in case of testing, time can be set to only 2 minutes in the future)
				let participatingEnd = new Date();

				if (process.env.TEST_WICHTELN !== 'true') {
					participatingEnd = addDays(participatingEnd, participatingTime);
					participatingEnd.setHours(23, 59, 59);
				} else {
					participatingEnd = addTestTime(participatingEnd);
				}

				// Build embed
				const row = new ActionRowBuilder()
					.addComponents(participateButton.data, participantsButton.data);

				// Send Embed
				const wichtelEmbed = buildEmbed({
					color: 0xDB27B7,
					title: 'Wichteln',
					description: `Es ist wieder so weit. Wir wichteln dieses Jahr wieder mit **Schrottspielen**!\nEs geht also darum möglichst beschissene Spiele zu verschenken.\n\nWir treffen uns am **${startTimeStr.split(', ')[0]} um ${startTimeStr.split(', ')[1]} Uhr**. Dann werden wir zusammen die Spiele 2 Stunden lang spielen und uns gegenseitig beim Leiden zuschauen können.\nWer an diesem Tag nicht kann, muss sich keine Sorgen machen. Man kann das Spiel gerne auch zu einem anderen Zeitpunkt spielen. Es macht aber am meisten Spaß, wenn die Person, die einem das Spiel geschenkt hat, dabei ist.\n\nIhr habt bis zum **${datetime.format(participatingEnd, 'DD.MM.YYYY')} um 23:59 Uhr** Zeit, um euch anzumelden. Dazu müsst ihr einfach nur den Knopf drücken!\n`,
					origin: this.data.name,
					fields: null,
					thumbnail: null,
					image: null,
					footer: null
				});
				wichtelChannel.send({ embeds: [wichtelEmbed], components: [row] }).then(message => {
					jsonManager.updateMessageID('wichtel_id', message.id);
				}).catch(err => {
					logger.error(err, __filename);
				});


				// Save end-time and time for private messages in JSON
				setWichtelData(
					datetime.format(participatingEnd, 'DD.MM.YYYY, HH:mm:ss'),
					`${startTimeStr.split(', ')[0]} um ${startTimeStr.split(', ')[1]} Uhr`
				);

				// Start loop to check for the end of wichteln
				await startWichtelLoop(interaction.client);

				await editInteractionReply(interaction, 'Das Wichteln wurde gestartet.');

				logger.info(`Wichteln was started by "${interaction.user.tag}"`);
			} else {
				logger.info(`The wichtel-channel with id ${config.get('WICHTEL_CHANNEL_ID')} could not be found.`);
				await editInteractionReply(interaction, {
					content: 'Der Wichtel-Channel konnte nicht gefunden werden!',
					ephemeral: true
				});
			}
		} else {
			logger.info(`"${interaction.user.tag}" entered a datetime with wrong regex when starting the wichteln.`);
			await editInteractionReply(interaction, {
				content: 'Du hast das "wichtel-date" falsch angegeben!',
				ephemeral: true
			});
		}
	},
};

/**
 * Adds a specified number of days to a given date.
 *
 * @param {Date} dateToAdd - The initial date to which days will be added.
 * @param {number} days - The number of days to add to the date.
 * @return {Date} The new date after adding the specified number of days.
 */
function addDays(dateToAdd, days) {
	const date = new Date(dateToAdd);
	date.setDate(date.getDate() + days);
	return date;
}

/**
 * Adds 2 minutes to the provided date.
 *
 * @param {Date} dateToAdd - The date to which 2 minutes will be added. It can be a date string or a Date object.
 * @return {Date} - A new Date object representing the original date plus 2 minutes.
 */
function addTestTime(dateToAdd) {
	const date = new Date(dateToAdd);
	date.setTime(date.getTime() + 2 * 60 * 1000);
	return date;
}