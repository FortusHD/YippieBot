// Imports
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { editInteractionReply } = require('../util/util');

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

				if (queue.songs.length === 1) {
					await queue.stop();
					logger.info(`${skippedSong.name} skipped! Queue is now empty`);

					const skipEmbed = new EmbedBuilder()
						.setColor(0x000aff)
						.setTitle(`:fast_forward: ${skippedSong.name} übersprungen`)
						.setDescription(`**${skippedSong.name}** wurde übersprungen!\n
						Die Warteschlange ist jetzt leer.`);

					await editInteractionReply(interaction, { content: '', embeds: [skipEmbed] })
				} else {
					const song = await queue.skip();
					logger.info(`${skippedSong.name} skipped! Now playing: ${song.name}.`);

					const skipEmbed = new EmbedBuilder()
						.setColor(0x000aff)
						.setTitle(`:fast_forward: ${skippedSong.name} übersprungen`)
						.setDescription(`**${skippedSong.name}** wurde übersprungen!\nJetzt läuft: **${song.name}**`);

					await editInteractionReply(interaction, { content: '', embeds: [skipEmbed] });
				}
			} catch (e) {
				logger.warn(`Error while skipping: ${e}`);
				await editInteractionReply(interaction, 'Beim Überspringen ist ein Fehler aufgetreten.');
			}
		} else {
			logger.info('No song playing.');
			await editInteractionReply(interaction, 'Gerade läuft kein Song du Idiot!');
		}
	},
};