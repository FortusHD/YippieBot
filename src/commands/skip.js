// Imports
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { editInteractionReply } = require('../util/util');

// Skips the current playing song
module.exports = {
	guild: true,
	dm: false,
	player: true,
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Überspringt den aktuellen Song'),
	async execute(interaction) {
		logger.info(`Handling skip command used by "${interaction.user.tag}".`);
		await interaction.reply('Überspringe...');

		const client = interaction.client;
		const player = client.riffy.players.get(interaction.guildId);

		if (player.current) {
			const skippedSong = player.current;
			const newSong = player.queue ? player.queue.first : null;

			await player.stop();

			if (!newSong) {
				logger.info(`${skippedSong.info.title} skipped! Queue is now empty`);

				const skipEmbed = new EmbedBuilder()
					.setColor(0x000aff)
					.setTitle(`:fast_forward: ${skippedSong.info.title} übersprungen`)
					.setDescription(`**${skippedSong.info.title}** wurde übersprungen!\nDie Warteschlange ist jetzt leer.`);

				await editInteractionReply(interaction, { content: '', embeds: [skipEmbed] });
			} else {
				logger.info(`${skippedSong.info.title} skipped! Now playing: ${newSong.info.title}.`);

				const skipEmbed = new EmbedBuilder()
					.setColor(0x000aff)
					.setTitle(`:fast_forward: ${skippedSong.info.title} übersprungen`)
					.setDescription(`**${skippedSong.info.title}** wurde übersprungen!\nJetzt läuft: **${newSong.info.title}**`);

				await editInteractionReply(interaction, { content: '', embeds: [skipEmbed] });
			}
		} else {
			logger.info('No song playing.');
			await editInteractionReply(interaction, 'Gerade läuft kein Song du Idiot!');
		}
	},
};