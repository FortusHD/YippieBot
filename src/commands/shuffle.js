// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const client = require('../main/main');

// Shuffles the queue
module.exports = {
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription('Mischt die aktuelle Queue'),
	async execute(interaction) {
		logger.info(`Handling shuffle command used by "${interaction.user.tag}".`);

		const player = client.riffy.players.get(interaction.guildId);

		if (player) {
			const queue = player.queue;

			if (queue) {
				await queue.shuffle();

				logger.info(`"${interaction.member.user.tag}" shuffled the queue.`);
				interaction.reply('Die Queue wurde gemischt');
			} else {
				logger.info('Queue was empty.');
				interaction.reply('Die Queue ist leer.');
			}
		}  else {
			logger.info('Queue was empty.');
			interaction.reply('Die Queue ist leer.');
		}
	},
};