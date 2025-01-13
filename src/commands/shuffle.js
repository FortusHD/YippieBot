// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

// Shuffles the queue
module.exports = {
	guild: true,
	dm: false,
	player: true,
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription('Mischt die aktuelle Queue'),
	async execute(interaction) {
		logger.info(`Handling shuffle command used by "${interaction.user.tag}".`);

		const client = interaction.client;
		const player = client.riffy.players.get(interaction.guildId);

		const queue = player.queue;

		if (queue) {
			queue.shuffle();

			logger.info(`"${interaction.member.user.tag}" shuffled the queue.`);
			await interaction.reply('Die Queue wurde gemischt');
		} else {
			logger.info('Queue was empty.');
			await interaction.reply('Die Queue ist leer.');
		}
	},
};