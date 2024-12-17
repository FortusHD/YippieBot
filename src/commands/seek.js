// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { editInteractionReply } = require('../util/util');

// Seeks the current playing song for the given time
module.exports = {
	data: new SlashCommandBuilder()
		.setName('seek')
		.setDescription('Springt zu einer bestimmten Stelle im aktuellen song')
		.addNumberOption(option =>
			option
				.setName('time')
				.setDescription('Der Zeitpunkt im Song (in Sekunden)')
				.setMinValue(0)
				.setRequired(true),
		),
	async execute(interaction) {
		logger.info(`Handling seek command used by "${interaction.user.tag}".`);

		const time = interaction.options.getNumber('time');
		const formattedTime = formatTime(time);

		await interaction.reply(`Springe zu ${formattedTime}...`);
		const queue = interaction.client.distube.getQueue(interaction.guild);

		if (queue) {
			queue.seek(time);
			logger.info(`Seeked to ${formattedTime}`);
			await editInteractionReply(interaction, `Es wurde zu \`${formattedTime}\` gesprungen`);
		} else {
			logger.info('No song playing.');
			await editInteractionReply(interaction, 'Gerade läuft kein Song du Idiot!');
		}
	},
};

/**
 * Formats a given time in seconds into a string representation.
 * If the time is 3600 seconds or greater, the format will be in "HH:MM".
 * If the time is less than 3600 seconds, the format will be in "MM".
 * Returns a placeholder value '??:??' if no valid time is provided.
 *
 * @param {number} time The time in seconds to be formatted.
 * @return {string} The formatted time as a string.
 */
function formatTime(time) {
	if (!time) {
		return '??:??';
	}

	return time >= 3600
		? new Date(time * 1000).toISOString().substring(11, 16)
		: new Date(time * 1000).toISOString().substring(14, 16);
}