// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

// Pauses (or resumes) the current song
module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('Pausiert oder startet den Bot wieder'),
	async execute(interaction) {
		logger.info(`Handling pause command used by "${interaction.user.tag}".`);

		const queue = interaction.client.distube.getQueue(interaction.guild);

		if (queue) {
			if (queue.paused) {
				queue.resume();
				logger.info('Bot was resumed.');
				interaction.reply('Der Bot spielt jetzt weiter.');
			} else {
				queue.pause();
				logger.info('Bot was paused.');
				interaction.reply('Der Bot wurde pausiert');
			}
		} else {
			logger.info('Nothing playing right now.');
			interaction.reply('Gerade spielt doch gar nichts.');
		}
	},
};