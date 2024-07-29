// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

// Seeks the current playing song for the given time
module.exports = {
	data: new SlashCommandBuilder()
		.setName('seek')
		.setDescription('Springt zu einer bestimmten Stelle im aktuellen song')
		.addNumberOption(option =>
			option
				.setName('time')
				.setDescription('Der Zeitpunkt im SOng (in Sekunden)')
				.setMinValue(0)
				.setRequired(true),
		),
	async execute(interaction) {
		const time = interaction.options.getNumber('time');
		const formattedTime = formatTime(time);

		logger.info(`${interaction.member.user.tag} requested to seek to ${formattedTime} in the current song.`);
		await interaction.reply(`Springe zu ${formattedTime}...`);

		const queue = interaction.client.distube.getQueue(interaction.guild);

		if (queue) {
			queue.seek(time);
			logger.info(`Seeked to ${formattedTime}`);
			await interaction.editReply(`Es wurde zu \`${formattedTime}\` gesprungen`);
		} else {
			logger.info('No song playing.');
			await interaction.editReply('Gerade läuft kein Song du Idiot!');
		}
	},
};

function formatTime(time) {
	if (!time) {
		return '??:??'
	}

	return time >= 3600
		? new Date(time * 1000).toISOString().substring(11, 16)
		: new Date(time * 1000).toISOString().substring(14, 16);
}