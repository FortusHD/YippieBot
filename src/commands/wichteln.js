const { ActionRowBuilder, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const schedule = require('node-schedule');
const datetime = require('date-and-time');
const logger = require('../logging/logger.js');
const data = require('../util/data.js');
const participateButton = require('../buttons/participateButton.js');
const jsonManager = require('../util/json_manager.js');

const datetime_regex = '[0-3][0-9].[0-1][0-9].[0-9][0-9][0-9][0-9], [0-2][0-9]:[0-5][0-9]';

let wichtelMessage = null;

function addDays(dateToAdd, days) {
	const date = dateToAdd;
	date.setDate(date.getDate() + days);
	return date;
}

function dateWithTimeZone(timeZone, year, month, day, hour, minute, second) {
	const date = new Date(Date.UTC(year, month, day, hour, minute, second));

	const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
	const tzDate = new Date(date.toLocaleString('de-DE', { timeZone: timeZone }));
	const offset = utcDate.getTime() - tzDate.getTime();

	date.setTime(date.getTime() + offset);

	return date;
}

function matchParticipant(participant, participants, matches) {
	const match = participants[Math.floor(Math.random() * participants.length)];

	if (participant.id === match.id) {
		return matchParticipant(participant, participants, matches);
	} else {
		matches.push([participant, match]);
		participants = participants.filter(function(value) {
			return value.id !== match.id;
		});

		return participants;
	}
}

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

		if (interaction.user.id === data.ADMIN_USER_ID) {
			const startTimeStr = interaction.options.getString('wichtel-date');
			const participatingTime = interaction.options.getInteger('participating-time');

			if (startTimeStr.match(datetime_regex)) {
				const wichtelChannel = interaction.client.guilds.cache.get(data.GUILD_ID).channels.cache.get(data.WICHTEL_CHANNEL_ID);

				if (wichtelChannel) {
					let participatingEnd = new Date();
					participatingEnd = addDays(participatingEnd, participatingTime);

					const row = new ActionRowBuilder()
						.addComponents(participateButton.data);

					const wichtelEmbed = new EmbedBuilder()
						.setColor(0xDB27B7)
						.setTitle('Wichteln')
						.setDescription(`Es ist wieder soweit. Wir schrottwichteln dieses Jahr wieder! Wir treffen uns am ${startTimeStr.split(', ')[0]} um ${startTimeStr.split(', ')[1]} Uhr. Ihr habt bis zum ${datetime.format(participatingEnd, 'DD.MM.YYYY')} um 23:59 Uhr Zeit um euch anzumelden. Dazu müsst ihr einfach nur den Knopf drücken!`);

					await jsonManager.resetParticipants();

					wichtelChannel.send({ embeds: [wichtelEmbed], components: [row] }).then(message => {
						wichtelMessage = message;
					}).catch(err => {
						logger.error(err, __filename);
					});

					// TODO: Save message and delete (or just deactivate button) after time is up

					interaction.reply('Das Wichteln wurde gestartet.');

					schedule.scheduleJob(dateWithTimeZone('Europe/Berlin', participatingEnd.getFullYear(), participatingEnd.getMonth(), participatingEnd.getDate(), '23', '59', '59'), function() {
						logger.info(`Starting Wichteln at ${new Date().toString()}`);

						const participants = jsonManager.getParticipants();
						let participantsCloned = [].concat(participants);
						const matches = [];

						for (const participant in participants) {
							participantsCloned = matchParticipant(participant, participantsCloned, matches);
						}

						for (const match in matches) {
							const user = interaction.client.users.fetch(match[0].id);
							const matchEmbed = new EmbedBuilder()
								.setColor(0xDB27B7)
								.setTitle('Wichtel-Post')
								.setDescription(`Hallo,\ndein Wichtel-Partner ist\n${match[1].dcName}(Steam: ${match[1].steamName})\nÜberlege dir ein schönes Spiel für deinen Partner und kaufe es auf Steam und lege es als Geschenk für den ${startTimeStr.split(', ')[0]} um ${startTimeStr.split(', ')[1]} Uhr oder früher fest.`);

							logger.info(`Sending ${match[0].dcName} their partner ${match[1].dcName}.`);

							user.send({ embeds: [matchEmbed] });
						}

						if (wichtelMessage) {
							wichtelMessage.delete().then(() => {
								logger.info('Deleted Wichtel message.');
							}).catch(err => {
								logger.error(err, __filename);
							});
							wichtelMessage = null;
						}
					});
				} else {
					logger.info(`The wichtel-channel with id ${data.WICHTEL_CHANNEL_ID} could not be found.`);
					interaction.reply({ content: 'Der Wichtel-Channel konnte nicht gefunden werden!', ephemeral: true });
				}
			} else {
				logger.info(`${interaction.member.user.tag} entered a datetime with wrong regex.`);
				interaction.reply({ content: 'Du hast das "wichtel-date" falsch angegeben!', ephemeral: true });
			}
		} else {
			logger.info(`${interaction.member.user.tag} does not have permission.`);
			interaction.reply({ content: 'Dazu hast du keine Berechtigung!', ephemeral: true });
		}
	},
};