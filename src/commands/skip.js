// Imports
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

// Skips the current playing song
module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Überspringt den aktuellen Song'),
	async execute(interaction) {
		logger.info(`${interaction.member.user.tag} requested to skip the current song.`);
		await interaction.reply('Überspringe...');

		const queue = interaction.client.distube.getQueue(interaction.guild);

		if (queue) {
			try {
				const skippedSong = queue.songs[0];
				const song = await queue.skip();
				logger.info(`${skippedSong.name} skipped! Now playing: ${song.name}.`);

				const skipEmbed = new EmbedBuilder()
					.setColor(0x000aff)
					.setTitle(`:fast_forward: ${skippedSong.name} übersprungen`)
					.setDescription(`**${skippedSong.name}** wurde übersprungen!\nJetzt läuft: **${song.name}**`);

				await interaction.editReply({ content: '', embeds: [skipEmbed] });
			} catch (e) {
				logger.warn(`Error while skipping: ${e}`);
				await interaction.editReply('Beim Überspringen ist ein Fehler aufgetreten.');
			}
		} else {
			logger.info('No song playing.');
			await interaction.editReply('Gerade läuft kein Song du Idiot!');
		}
	},
};