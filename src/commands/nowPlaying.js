const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('np')
		.setDescription('Zeigt dir an, was gerade spielt'),
	async execute(interaction) {
		logger.info(`${interaction.member.user.tag} requested to see now playing song.`);

		const queue = interaction.client.distube.getQueue(interaction.guild);

		if (queue) {
			logger.info('Nothing playing right now.');
			interaction.reply('Gerade spielt nichts.');
		}

		const song = queue.songs[0];
		const songEmbed = new EmbedBuilder()
			.setColor(0x000aff)
			.setTitle(`:musical_note: ${song.name}`)
			.setDescription(`Gerade spielt **${song.name}**. Der Song wurde von <@${interaction.member.id}> eingereiht.`)
			.setThumbnail(song.thumbnail);

		logger.info(`${song.name} is now playing. This song was requested by ${song.member.user.tag}`);

		interaction.reply({ embeds: [songEmbed] });
	},
};