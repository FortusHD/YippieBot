const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Überspringt den aktuellen Song'),
	async execute(interaction) {
		logger.info(`${interaction.member.user.tag} requested to skip the current song.`);

		const queue = interaction.client.distube.getQueue(interaction.guild);

		if (queue) {
			try {
				const skippedSong = queue.songs[0];
				const song = await queue.skip();
				logger.info(`${skippedSong.name} skipped! Now playing: ${song.name}.`);
				interaction.reply(`${skippedSong.name} wurde übersprungen! Jetzt läuft:\n${song.name}`);
			} catch (e) {
				logger.warn(`Error while skipping: ${e}`);
				interaction.reply('Beim Überspringen ist ein Fehler aufgetreten.');
			}
		} else {
			logger.info('No song playing.');
			interaction.reply('Gerade läuft kein Song du Idiot!');
		}
	},
};