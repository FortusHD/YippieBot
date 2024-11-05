// Imports
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { buildCurrentSongPos } = require('../util/util');

// Displays the current playing song
module.exports = {
	data: new SlashCommandBuilder()
		.setName('np')
		.setDescription('Zeigt dir an, was gerade spielt'),
	async execute(interaction) {
		logger.info(`${interaction.member.user.tag} requested to see now playing song.`);

		const queue = interaction.client.distube.getQueue(interaction.guild);

		if (!queue || !queue.songs || queue.songs.length === 0) {
			logger.info('Nothing playing right now.');
			interaction.reply('Gerade spielt nichts.');
			return;
		}

		const song = queue.songs[0];
		const songEmbed = new EmbedBuilder()
			.setColor(0x000aff)
			.setTitle(`:musical_note: ${song.name}`)
			.setDescription(`Gerade spielt **${song.name}**. Der Song wurde von <@${song.member.id}> eingereiht.\n\n${buildCurrentSongPos(queue.formattedCurrentTime, song.formattedDuration)}`)
			.setThumbnail(song.thumbnail);
		const openButton = new ButtonBuilder()
			.setLabel('Öffnen')
			.setStyle(ButtonStyle.Link)
			.setURL(song.url);

		logger.info(`${song.name} is now playing. This song was requested by ${song.member.user.tag}`);

		interaction.reply({ embeds: [songEmbed], components: [new ActionRowBuilder().addComponents(openButton)] });
	},
};