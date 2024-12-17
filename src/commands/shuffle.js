// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

// Shuffles the queue
module.exports = {
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription('Mischt die aktuelle Queue'),
	async execute(interaction) {
		logger.info(`Handling shuffle command used by "${interaction.user.tag}".`);

		const queue = interaction.client.distube.getQueue(interaction.guild);

		if (queue) {
			await queue.shuffle();

			logger.info(`"${interaction.member.user.tag}" shuffled the queue.`);
			interaction.reply('Die Queue wurde gemischt');
		} else {
			logger.info('Queue was empty.');
			interaction.reply('Die Queue ist leer.');
		}
	},
};