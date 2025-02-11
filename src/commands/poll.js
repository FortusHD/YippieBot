// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { addPoll } = require('../util/json_manager');
const { buildEmbed } = require('../util/util');

// Starts a poll with up to 15 options, the result will be sent once end time is passed
module.exports = {
	guild: true,
	dm: false,
	data: new SlashCommandBuilder()
		.setName('poll')
		.setDescription('Startet eine Abstimmung in diesem Channel')
		.addStringOption(option =>
			option
				.setName('question')
				.setDescription('Die Frage, über die abgestimmt werden soll')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('time')
				.setDescription('Zeit für die Abstimmung (d, h oder m)')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('answer1')
				.setDescription('Antwort 1 (emoji) (text)')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('answer2')
				.setDescription('Antwort 2 (emoji) (text)')
				.setRequired(true))
		.addIntegerOption(option =>
			option
				.setName('max_votes')
				.setDescription('Anzahl der Stimmen')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('answer3')
				.setDescription('Antwort 3 (emoji) (text)')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('answer4')
				.setDescription('Antwort 4 (emoji) (text)')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('answer5')
				.setDescription('Antwort 5 (emoji) (text)')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('answer6')
				.setDescription('Antwort 6 (emoji) (text)')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('answer7')
				.setDescription('Antwort 7 (emoji) (text)')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('answer8')
				.setDescription('Antwort 8 (emoji) (text)')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('answer9')
				.setDescription('Antwort 9 (emoji) (text)')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('answer10')
				.setDescription('Antwort 10 (emoji) (text)')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('answer11')
				.setDescription('Antwort 11 (emoji) (text)')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('answer12')
				.setDescription('Antwort 12 (emoji) (text)')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('answer13')
				.setDescription('Antwort 13 (emoji) (text)')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('answer14')
				.setDescription('Antwort 14 (emoji) (text)')
				.setRequired(false))
		.addStringOption(option =>
			option
				.setName('answer15')
				.setDescription('Antwort 15 (emoji) (text)')
				.setRequired(false)),
	async execute(interaction) {
		logger.info(`Handling poll command used by "${interaction.user.tag}".`);

		await interaction.reply({ content: 'Abstimmung wird gestartet!', ephemeral: true });

		// Basic data
		const channel = interaction.channel;
		const question = interaction.options.getString('question');
		const time = interaction.options.getString('time');
		const max_votes = interaction.options.getInteger('max_votes');

		const dmChannel = await interaction.member.user.createDM();

		// Init
		const rawAnswers = [];
		const answers = [];
		const emojiSet = new Set();

		// Load raw answers for error messages
		for (let i = 1; i <= 15; i++) {
			const answer = interaction.options.getString(`answer${i}`);
			if (answer !== null && answer !== undefined && answer !== '') {
				rawAnswers.push(answer);
			}
		}

		// Build error embed here, for later use
		const answersString = rawAnswers.map((answer, index) => `**answer${index + 1}**: ${answer}`).join('\n');
		const errorEmbed = buildEmbed({
			color: 0xed1010,
			title: 'Deine Eingaben',
			description: `**question**: ${question}\n**time**: ${time}\n${max_votes ? `**max_votes**: ${max_votes}\n` : ''}${answersString}`,
			origin: this.data.name
		});

		// Collect all answers and check for validity
		for (let i = 1; i <= 15; i++) {
			const answer = interaction.options.getString(`answer${i}`);
			if (answer !== null && answer !== undefined && answer !== '') {
				const split = answer.split(' ');
				const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/ug;
				const customEmojiRegex = /<a?:.+:\d+>/u;

				// Answer must consist of an emoji follow by some string
				if (split.length > 1 && (emojiRegex.test(split[0]) || customEmojiRegex.test(split[0]))) {
					// Emojis here are used for identifying, so the y must be unique
					if (emojiSet.has(split[0])) {
						await dmChannel.send({
							content: `Das Emoji für Antwort ${i} wurde bereits verwendet. Bitte wähle ein anderes Emoji.`,
							embeds: [errorEmbed],
						});
						return;
					}
					emojiSet.add(split[0]);
					answers.push(answer);
				} else {
					await dmChannel.send({
						content: `Bei deinem Poll hast du bei Antwort ${i} nicht das richtige Format befolgt. Bitte stelle sicher, dass die Antwort folgende Form hat: (emoji) (text)`,
						embeds: [errorEmbed],
					});
					return;
				}
			}
		}

		const time_regex = /\d+[dhm]/;

		// Check if time was given correctly
		if (time_regex.test(time)) {
			const time_number = time.substring(0, time.length - 1);
			const time_unit = time.substring(time.length - 1);

			const timestamp = createUnixTimestamp(time_number, time_unit);
			const timestamp_string = `<t:${timestamp}:R>`;

			const pollEmbed = buildEmbed({
				color: 0x2210e8,
				title: 'Umfrage',
				description: question,
				origin: this.data.name,
				fields: [
					{name: 'Antwortmöglichkeiten', value: answers.join('\n'), inline: false},
					{name: 'Infos', value: `:alarm_clock: Ende: ${timestamp_string}\n:ballot_box_with_check: Anzahl an Stimmen: ${max_votes ? max_votes : '∞'}`, inline: false},
				]
			});

			channel.send({ embeds: [pollEmbed] }).then(message => {
				addPoll(message.id, interaction.channel.id, timestamp, max_votes);

				for (let i = 0; i < answers.length; i++) {
					message.react(answers[i].split(' ')[0]);
				}
			}).catch(err => {
				logger.error(err, __filename);
			});

			logger.info(`"${interaction.user.tag}" started a poll with ${answers.length} answers.`);
		} else {
			await dmChannel.send({
				content: 'Bei deinem Poll hast du die Zeit falsch angegeben. Erlaubt ist nur dieses Format: 7d, 10h oder 33m',
				embeds: [errorEmbed],
			});
			logger.info(`"${interaction.user.tag}" tried to start a poll with invalid time format.`);
		}
	},
};

/**
 * Creates a Unix timestamp by adding the specified amount of time to the current date.
 *
 * @param {string} timeAdded - The amount of time to add.
 * @param {string} timeUnit - The unit of time ('d' for days, 'h' for hours, 'm' for minutes).
 * @return {number} Unix timestamp in seconds.
 */
function createUnixTimestamp(timeAdded, timeUnit) {
	const date = new Date();
	const time = parseInt(timeAdded, 10);

	switch (timeUnit) {
	case 'd':
		date.setDate(date.getDate() + time);
		break;
	case 'h':
		date.setHours(date.getHours() + time);
		break;
	case 'm':
		date.setMinutes(date.getMinutes() + time);
		break;
	}

	date.setSeconds(0, 0);
	return Math.floor(date.getTime() / 1000);
}