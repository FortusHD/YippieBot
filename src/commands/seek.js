// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { editInteractionReply, formatDuration } = require('../util/util');

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
		// TODO: Change from seconds (int) to minutes + seconds  (String, mm:ss, m:ss)
		logger.info(`Handling seek command used by "${interaction.user.tag}".`);

		const client = interaction.client;
		const time = interaction.options.getNumber('time');
		const formattedTime = formatDuration(time);

		await interaction.reply(`Springe zu ${formattedTime}...`);
		const player = client.riffy.players.get(interaction.guildId);

		if (player && player.current) {
			player.seek(time * 1000);
			logger.info(`Seeked to ${formattedTime}`);
			await editInteractionReply(interaction, `Es wurde zu \`${formattedTime}\` gesprungen`);
		} else {
			logger.info('No song playing.');
			await editInteractionReply(interaction, 'Gerade läuft kein Song du Idiot!');
		}
	},
};