// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

// Disconnects bot from the current connected voice channel
module.exports = {
	player: true,
	data: new SlashCommandBuilder()
		.setName('dc')
		.setDescription('Disconnected den Bot'),
	async execute(interaction) {
		logger.info(`Handling disconnect command used by "${interaction.user.tag}".`);

		const dismisses = ['Tschö mit Ö', 'Tschau mit AU', 'Meddl off', 'Bis Baldrian', 'Tschüsseldorf',
			'Ich verabscheue mich', 'Tschau, du Sau', 'Tschüss mit Üs', 'Sayonara Carbonara', 'Auf Wiederhörnchen',
			'Man siebt sich'];

		const client = interaction.client;
		const player = client.riffy.players.get(interaction.guildId);

		player.disconnect().destroy();
		await interaction.reply(dismisses[Math.floor(Math.random() * dismisses.length)]);

		logger.info(`Bot was disconnected by "${interaction.user.tag}".`);
	},
};